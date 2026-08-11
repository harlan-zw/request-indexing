import type { indexing_v3 } from '@googleapis/indexing/v3'
import type { GaxiosError } from 'googleapis-common'
import type { GoogleAccountsSelect } from '~~/layers/core/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, getQuery, getRouterParams } from 'h3'
import { incrementUsage } from '~~/layers/core/server/app/services/usage'
import { authenticateUser } from '~~/layers/core/server/app/utils/auth'
import { googleAccounts, googleOAuthClients, indexingJobs, sites, userSites } from '~~/layers/core/server/db/schema'
import { checkProToolRateLimit } from '~~/layers/pro-saas/server/utils/rate-limit'
import { logWarn } from '~~/shared/logging'

type IndexingTokens = GoogleAccountsSelect['tokens']

type SubmitOutcome
  = | { _tag: 'Ok', status: 'submitted' | 'already-submitted', metadata: indexing_v3.Schema$UrlNotificationMetadata | indexing_v3.Schema$PublishUrlNotificationResponse }
    | { _tag: 'Err', reason: 'quota_exceeded' | 'unverified_property' | 'invalid_grant' | 'google_error', statusCode: number, message: string }

function mapGaxiosError(error: GaxiosError): (SubmitOutcome & { _tag: 'Err' }) | null {
  const status = error.status
  const upstreamMessage = (error.response?.data as { error?: { message?: string } } | undefined)?.error?.message ?? error.message

  if (status === 403) {
    return {
      _tag: 'Err',
      reason: 'unverified_property',
      statusCode: 403,
      message: `Google rejected this request: ${upstreamMessage}. Make sure the connected Google account is a verified owner of this property in Search Console.`,
    }
  }
  if (status === 429) {
    return {
      _tag: 'Err',
      reason: 'quota_exceeded',
      statusCode: 429,
      message: 'Google Indexing API daily quota was exceeded for this account. Try again tomorrow.',
    }
  }
  if (status === 401) {
    return {
      _tag: 'Err',
      reason: 'invalid_grant',
      statusCode: 401,
      message: 'The Google indexing grant is no longer valid. Please reconnect your account.',
    }
  }
  return null
}

function wasSubmittedRecently(metadata: indexing_v3.Schema$UrlNotificationMetadata | undefined): boolean {
  const notifyTime = metadata?.latestUpdate?.type === 'URL_UPDATED' ? metadata.latestUpdate.notifyTime : undefined
  if (!notifyTime)
    return false
  return new Date(notifyTime).getTime() > Date.now() - 1000 * 60 * 60 * 48
}

interface SubmitOpts {
  targetUrl: string
  tokens: IndexingTokens
  clientId: string
  clientSecret: string
  onTokenRefresh: (tokens: IndexingTokens) => Promise<void>
}

// Notifies Google that a URL changed via the Web Search Indexing API. Skips
// the publish call if we already notified Google about this exact URL in the
// last 48 hours (Google discards more frequent notifications anyway).
async function submitUrlToGoogle(opts: SubmitOpts): Promise<SubmitOutcome> {
  const { indexing } = await import('@googleapis/indexing')
  const { OAuth2Client } = await import('googleapis-common')

  const oauth2Client = new OAuth2Client({ clientId: opts.clientId, clientSecret: opts.clientSecret })
  oauth2Client.setCredentials(opts.tokens)
  const api = indexing({ version: 'v3', auth: oauth2Client })

  try {
    let metadata: indexing_v3.Schema$UrlNotificationMetadata | undefined
    try {
      metadata = (await api.urlNotifications.getMetadata({ url: opts.targetUrl })).data
    }
    catch (error) {
      const gaxiosError = error as GaxiosError
      // A 404 just means Google has no record for this URL yet - safe to
      // proceed to publish. Anything else that maps to a domain error should
      // short-circuit here since publish would fail identically.
      if (gaxiosError.status !== 404) {
        const mapped = mapGaxiosError(gaxiosError)
        if (mapped)
          return mapped
      }
    }

    if (wasSubmittedRecently(metadata)) {
      return { _tag: 'Ok', status: 'already-submitted', metadata: metadata! }
    }

    const published = await api.urlNotifications.publish({
      requestBody: { type: 'URL_UPDATED', url: opts.targetUrl },
    })
    return { _tag: 'Ok', status: 'submitted', metadata: published.data }
  }
  catch (error) {
    return mapGaxiosError(error as GaxiosError) ?? {
      _tag: 'Err',
      reason: 'google_error',
      statusCode: 502,
      message: error instanceof Error ? error.message : 'Google Indexing API request failed',
    }
  }
  finally {
    // google-auth-library transparently refreshes the access token when it
    // has expired. Persist that new token so the next request doesn't have
    // to refresh again; best-effort, the submission above already happened.
    const fresh = oauth2Client.credentials
    if (fresh.access_token && fresh.access_token !== opts.tokens.access_token) {
      await opts.onTokenRefresh({
        ...opts.tokens,
        access_token: fresh.access_token,
        expiry_date: fresh.expiry_date ?? opts.tokens.expiry_date,
        refresh_token: fresh.refresh_token ?? opts.tokens.refresh_token,
      }).catch(err => logWarn('indexing.token_persist_failed', err))
    }
  }
}

function toSitePath(url: string): string {
  const parsed = new URL(url)
  return `${parsed.pathname}${parsed.search}` || '/'
}

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  const db = useDrizzle(event)

  const { url } = getRouterParams(event, { decode: true })
  const { siteId } = getQuery(event)
  if (!url || typeof siteId !== 'string' || !siteId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing url param or siteId query' })
  }

  const site = await db.query.sites.findFirst({ where: eq(sites.publicId, siteId) })
  if (!site) {
    throw createError({ statusCode: 404, statusMessage: 'Site not found' })
  }

  const hasAccess = site.ownerId === user.userId
    || !!(await db.query.userSites.findFirst({
      where: and(eq(userSites.userId, user.userId), eq(userSites.siteId, site.siteId)),
    }))
  if (!hasAccess) {
    throw createError({ statusCode: 403, statusMessage: 'You do not have access to this site' })
  }

  const account = await db.query.googleAccounts.findFirst({
    where: and(eq(googleAccounts.userId, user.userId), eq(googleAccounts.type, 'indexing')),
  })
  if (!account) {
    throw createError({
      statusCode: 401,
      statusMessage: 'No Google indexing account connected. Please connect your account.',
    })
  }

  const oauthClient = await db.query.googleOAuthClients.findFirst({
    where: eq(googleOAuthClients.googleOAuthClientId, account.googleOAuthClientId),
  })
  if (!oauthClient) {
    throw createError({ statusCode: 500, statusMessage: 'Indexing OAuth client is no longer configured' })
  }

  // App-level fairness limit on top of Google's own per-project quota
  // (enforced downstream when the actual API call is made).
  await checkProToolRateLimit(event, { userId: String(user.userId), subscriptionStatus: user.subscriptionStatus })

  const result = await submitUrlToGoogle({
    targetUrl: url,
    tokens: account.tokens,
    clientId: oauthClient.clientId,
    clientSecret: oauthClient.clientSecret,
    onTokenRefresh: async (refreshed) => {
      await db.update(googleAccounts)
        .set({ tokens: refreshed })
        .where(eq(googleAccounts.googleAccountId, account.googleAccountId))
    },
  })

  if (result._tag === 'Err') {
    throw createError({ statusCode: result.statusCode, statusMessage: result.message, data: { reason: result.reason } })
  }

  const path = toSitePath(url)
  const state = result.status === 'submitted' ? 'submitted' : 'accepted'
  await db.insert(indexingJobs).values({
    siteId: site.siteId,
    path,
    transport: 'google',
    state,
    attempts: 1,
    submittedAt: new Date(),
  }).onConflictDoUpdate({
    target: [indexingJobs.siteId, indexingJobs.path, indexingJobs.transport],
    set: { state, submittedAt: new Date(), updatedAt: new Date(), lastError: null },
  }).catch(err => logWarn('indexing.job_record_failed', err, { siteId: site.siteId, path }))

  await incrementUsage(site.siteId, 'indexingApi').catch(err => logWarn('indexing.usage_record_failed', err, { siteId: site.siteId }))

  return {
    status: result.status,
    url,
    metadata: result.metadata,
  }
})

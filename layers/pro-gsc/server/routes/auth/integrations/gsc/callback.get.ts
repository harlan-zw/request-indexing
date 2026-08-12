import { eq } from 'drizzle-orm'
import { exchangeAuthCodeResult } from 'gscdump'
import { logger } from '~~/shared/server/logger'
import { scheduleGscdumpOnboardingReconcile } from '#layers/pro-gsc/server/utils/reconcile-gscdump-onboarding'

function errorDetails(error: unknown) {
  const record = typeof error === 'object' && error !== null ? error as Record<string, unknown> : {}
  const data = typeof record.data === 'object' && record.data !== null ? record.data as Record<string, unknown> : {}
  return {
    data,
    message: typeof data.message === 'string' ? data.message : error instanceof Error ? error.message : null,
    reason: typeof data.reason === 'string' ? data.reason : typeof data.error === 'string' ? data.error : null,
  }
}

export default defineEventHandler(async (event) => {
  const { state, code, error } = getQuery(event)

  if (error) {
    logger.error('[google auth] OAuth error:', error)
    return sendRedirect(event, '/pro/dashboard?error=google_auth_failed')
  }

  if (!code || !state) {
    throw createError({ statusCode: 422, statusMessage: 'Missing authorization code' })
  }

  const session = await getUserSession(event)
  if (state !== session.googleOauthState) {
    throw createError({ statusCode: 422, statusMessage: 'Invalid state' })
  }

  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const config = useRuntimeConfig(event)
  const host = getRequestHeader(event, 'host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const redirectUri = `${protocol}://${host}/auth/integrations/gsc/callback`

  const tokenResult = await exchangeAuthCodeResult(
    String(code),
    config.oauth.google.clientId,
    config.oauth.google.clientSecret,
    redirectUri,
  )
  if (!tokenResult.ok) {
    logger.error('[google auth] token exchange failed:', tokenResult.error)
    throw createError({ statusCode: 422, statusMessage: 'Failed to exchange authorization code' })
  }
  const tokenRes = tokenResult.value

  // Get user info (id, email, name)
  const googleUser = await $fetch<{ id: string, email: string, name?: string }>('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenRes.accessToken}` },
  }).catch((error: unknown) => {
    logger.error('[google auth] failed to get user info:', errorDetails(error).message)
    return null
  })

  logger.log('[google auth] connected:', googleUser?.email)

  const db = useDrizzle(event)

  // V1: GSC tokens live on `google_accounts` (type='auth' or 'indexing'),
  // not on the users row. Pull the existing auth row to backfill the refresh
  // token if Google didn't return a new one this round.
  const [existingUser] = await db
    .select({
      gscdumpUserId: schema.users.gscdumpUserId,
      gscdumpApiKey: schema.users.gscdumpApiKey,
    })
    .from(schema.users)
    .where(eq(schema.users.userId, session.user.id))

  const existingAuthAccount = await db
    .select()
    .from(schema.googleAccounts)
    .where(eq(schema.googleAccounts.userId, session.user.id))
    .get()

  const existingRefreshToken = (existingAuthAccount?.tokens as { refresh_token?: string | null } | undefined)?.refresh_token ?? null
  // Use new refresh token if provided, otherwise keep existing
  const refreshToken = tokenRes.refreshToken || existingRefreshToken

  // Sync user with gscdump.com partner API
  let gscdumpUserId = existingUser?.gscdumpUserId
  let gscdumpApiKey = existingUser?.gscdumpApiKey
  let gscdumpSyncFailed = false
  let gscdumpSyncReason: string | null = null
  let gscdumpSyncMessage: string | null = null
  if (googleUser?.id && refreshToken) {
    const gscdump = useGscdumpClient()
    const tokenParams = {
      accessToken: tokenRes.accessToken,
      refreshToken,
      tokenExpiresAt: tokenRes.expiresAt,
    }

    if (gscdumpUserId) {
      // Existing user — update tokens (also validates GSC scope and returns sites)
      // Retry once on failure since gscdump may have transient issues
      let updated: Awaited<ReturnType<typeof gscdump.updateUserTokens>> | null = null
      let lastError: unknown = null
      for (const attempt of [1, 2]) {
        updated = await gscdump.updateUserTokens(gscdumpUserId, tokenParams).catch((error: unknown) => {
          lastError = error
          const details = errorDetails(error)
          logger.warn(`[google auth] gscdump token update failed (attempt ${attempt}):`, details.message, details.reason)
          return null
        })
        if (updated)
          break
      }
      if (updated) {
        logger.log('[google auth] gscdump tokens updated:', gscdumpUserId, `${updated.sites.length} GSC properties accessible`)
        // Store API key if returned and we don't have one yet
        if ('apiKey' in updated && typeof updated.apiKey === 'string' && !gscdumpApiKey)
          gscdumpApiKey = updated.apiKey
      }
      else {
        const details = errorDetails(lastError)
        logger.error('[google auth] gscdump token update failed after retries for user:', gscdumpUserId, details.data)
        gscdumpSyncFailed = true
        gscdumpSyncReason = details.reason || 'UNKNOWN'
        gscdumpSyncMessage = details.message
      }
    }
    else {
      // New user — register
      const registration = await gscdump.registerUser({
        userGoogleId: googleUser.id,
        userEmail: googleUser.email,
        userName: googleUser.name,
        ...tokenParams,
      }).catch((error: unknown) => {
        const details = errorDetails(error)
        logger.warn('[google auth] gscdump registration failed:', details.message, details.reason)
        gscdumpSyncFailed = true
        gscdumpSyncReason = details.reason || 'REGISTER_FAILED'
        gscdumpSyncMessage = details.message
        return null
      })
      if (registration) {
        gscdumpUserId = registration.userId
        if (registration.apiKey)
          gscdumpApiKey = registration.apiKey
        logger.log('[google auth] gscdump user registered:', gscdumpUserId)
      }
    }

    // Repair seam for accounts that hold a gscdump user id but no API key.
    // `updateUserTokens` only ever returns a key opportunistically, so those
    // accounts took the branch above forever and never recovered one, leaving
    // every browser query failing with `gscdump_api_key_missing` while the
    // dashboard looked connected. Registration is gscdump's documented repair
    // path: it is idempotent, and it re-mints for the partner that owns the
    // user's tokens (see gscdump `shouldRemintUserApiKey`).
    if (gscdumpUserId && !gscdumpApiKey) {
      const reminted = await gscdump.registerUser({
        userGoogleId: googleUser.id,
        userEmail: googleUser.email,
        userName: googleUser.name,
        ...tokenParams,
      }).catch((error: unknown) => {
        const details = errorDetails(error)
        logger.warn('[google auth] gscdump api key remint failed:', details.message, details.reason)
        return null
      })
      // Adopt the key only when the idempotent call returned the same user.
      // A different id would mean a second gscdump user was created, which is
      // worth an error rather than silently binding this account to it.
      if (reminted?.userId === gscdumpUserId && reminted.apiKey) {
        gscdumpApiKey = reminted.apiKey
        logger.log('[google auth] gscdump api key reminted for:', gscdumpUserId)
      }
      else if (reminted && reminted.userId !== gscdumpUserId) {
        logger.error('[google auth] gscdump remint returned a different user:', reminted.userId, 'expected', gscdumpUserId)
      }
    }
  }
  else if (googleUser?.id && !refreshToken) {
    gscdumpSyncFailed = true
    gscdumpSyncReason = 'MISSING_REFRESH_TOKEN'
    gscdumpSyncMessage = 'Google did not return a refresh token. Please reconnect Google Search Console.'
  }

  // Update user record. Identity columns (google_id / google_email / google_name)
  // are no longer written — sign-in identity for Google sits in user_identities now,
  // and the GSC integration uses gsc_user_id / gsc_email (Phase 4a rename).
  // Persist gscdump identity columns on the users row; token material is
  // stored on `google_accounts` via the upstream OAuth callback flow.
  await db.update(schema.users)
    .set({
      ...(gscdumpUserId && { gscdumpUserId }),
      ...(gscdumpApiKey && { gscdumpApiKey }),
      updatedAt: Date.now(),
    })
    .where(eq(schema.users.userId, session.user.id))
    .catch((error: unknown) => {
      logger.error('[google auth] db update failed:', errorDetails(error).message)
    })

  await emitFirstProEvent(db, session.user.id, 'gsc_connected', {
    email: googleUser?.email ?? null,
  }).catch((error: unknown) => logger.error('[google auth] proEvent emit failed:', errorDetails(error).message))

  // Reconcile gscdump-dependent side effects asynchronously. User database
  // provisioning can lag OAuth; this waits in the background and avoids turning
  // a healthy provisioning state into a callback warning.
  if (gscdumpUserId) {
    scheduleGscdumpOnboardingReconcile(event, {
      userId: session.user.id,
      gscdumpUserId,
      currentTeamId: session.user.currentTeamId ?? null,
    })
  }

  // Get return URL before clearing it
  const returnTo = session.googleOauthReturnTo

  // Identity hints only; teams/currentTeam come from /api/pro/caller on
  // first paint after the redirect (ADR-0001/0002).
  await setUserSession(event, {
    user: {
      ...session.user,
      currentTeamId: session.user.currentTeamId ?? null,
    },
    gscConnected: true,
    gscEmail: googleUser?.email,
    googleOauthState: undefined,
    googleOauthReturnTo: undefined,
  })

  // Redirect back to original page or dashboard
  const redirectUrl = (typeof returnTo === 'string' && returnTo) ? returnTo : '/pro/dashboard'
  const separator = redirectUrl.includes('?') ? '&' : '?'
  if (gscdumpSyncFailed) {
    const params = new URLSearchParams({ gsc_sync_warning: '1' })
    if (gscdumpSyncReason)
      params.set('gsc_sync_reason', gscdumpSyncReason)
    if (gscdumpSyncMessage)
      params.set('gsc_sync_message', gscdumpSyncMessage.slice(0, 300))
    return sendRedirect(event, `${redirectUrl}${separator}${params.toString()}`)
  }
  return sendRedirect(event, redirectUrl)
})

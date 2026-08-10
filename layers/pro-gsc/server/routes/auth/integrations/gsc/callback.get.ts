import { eq } from 'drizzle-orm'
import { logger } from '~~/shared/server/logger'
import { scheduleGscdumpOnboardingReconcile } from '#layers/pro-gsc/server/utils/reconcile-gscdump-onboarding'

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

  // Exchange code for tokens
  const tokenRes = await $fetch<{
    access_token: string
    refresh_token?: string
    expires_in: number
    scope?: string // Space-separated scopes granted by user
  }>('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: config.oauth.google.clientId,
      client_secret: config.oauth.google.clientSecret,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: redirectUri,
    }).toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  }).catch((err) => {
    logger.error('[google auth] token exchange failed:', err.data || err.message)
    throw createError({ statusCode: 422, statusMessage: 'Failed to exchange authorization code' })
  })

  if (!tokenRes.access_token) {
    throw createError({ statusCode: 422, statusMessage: 'Failed to get access token' })
  }

  // Get user info (id, email, name)
  const googleUser = await $fetch<{ id: string, email: string, name?: string }>('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenRes.access_token}` },
  }).catch((err) => {
    logger.error('[google auth] failed to get user info:', err.message)
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
  const refreshToken = tokenRes.refresh_token || existingRefreshToken
  const tokenExpiryMs = Date.now() + tokenRes.expires_in * 1000

  // Sync user with gscdump.com partner API
  let gscdumpUserId = existingUser?.gscdumpUserId
  let gscdumpApiKey = existingUser?.gscdumpApiKey
  let gscdumpSyncFailed = false
  let gscdumpSyncReason: string | null = null
  let gscdumpSyncMessage: string | null = null
  if (googleUser?.id && refreshToken) {
    const gscdump = useGscdumpClient()
    const tokenExpiryUnix = Math.floor(Date.now() / 1000) + tokenRes.expires_in
    const tokenParams = {
      accessToken: tokenRes.access_token,
      refreshToken,
      tokenExpiresAt: tokenExpiryUnix,
    }

    if (gscdumpUserId) {
      // Existing user — update tokens (also validates GSC scope and returns sites)
      // Retry once on failure since gscdump may have transient issues
      let updated: Awaited<ReturnType<typeof gscdump.updateUserTokens>> | null = null
      let lastErr: any = null
      for (const attempt of [1, 2]) {
        updated = await gscdump.updateUserTokens(gscdumpUserId, tokenParams).catch((err) => {
          lastErr = err
          logger.warn(`[google auth] gscdump token update failed (attempt ${attempt}):`, err.data?.message || err.message, err.data?.reason || err.data?.error)
          return null
        })
        if (updated)
          break
      }
      if (updated) {
        logger.log('[google auth] gscdump tokens updated:', gscdumpUserId, `${updated.sites.length} GSC properties accessible`)
        // Store API key if returned and we don't have one yet
        if ('apiKey' in updated && updated.apiKey && !gscdumpApiKey) {
          gscdumpApiKey = updated.apiKey as string
        }
      }
      else {
        logger.error('[google auth] gscdump token update failed after retries for user:', gscdumpUserId, lastErr?.data || lastErr?.message)
        gscdumpSyncFailed = true
        gscdumpSyncReason = lastErr?.data?.reason || lastErr?.data?.error || 'UNKNOWN'
        gscdumpSyncMessage = lastErr?.data?.message || lastErr?.message || null
      }
    }
    else {
      // New user — register
      const registration = await gscdump.registerUser({
        userGoogleId: googleUser.id,
        userEmail: googleUser.email,
        userName: googleUser.name,
        ...tokenParams,
      }).catch((err) => {
        logger.warn('[google auth] gscdump registration failed:', err.data?.message || err.message, err.data?.reason || err.data?.error)
        gscdumpSyncFailed = true
        gscdumpSyncReason = err?.data?.reason || err?.data?.error || 'REGISTER_FAILED'
        gscdumpSyncMessage = err?.data?.message || err?.message || null
        return null
      })
      if (registration) {
        gscdumpUserId = registration.userId
        if (registration.apiKey)
          gscdumpApiKey = registration.apiKey
        logger.log('[google auth] gscdump user registered:', gscdumpUserId)
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
    .catch((err: any) => {
      logger.error('[google auth] db update failed:', err.message)
    })

  // Silence unused locals (will be wired into google_accounts row when the
  // auth flow consolidates here; for now upstream `auth/google.get.ts` writes it).
  void tokenRes.access_token
  void tokenRes.scope
  void refreshToken
  void tokenExpiryMs

  await emitFirstProEvent(db, session.user.id, 'gsc_connected', {
    email: googleUser?.email ?? null,
  }).catch(err => logger.error('[google auth] proEvent emit failed:', err.message))

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

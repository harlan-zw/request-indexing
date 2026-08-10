import { and, eq } from 'drizzle-orm'
import { logger } from '~~/shared/server/logger'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { googleAccounts, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// Re-push stored Google tokens to gscdump without requiring a new OAuth flow.
// Useful when the initial token sync failed silently.
//
// V1: per-user Google tokens now live on `google_accounts` (type='auth'),
// not on `users.googleAccessToken/RefreshToken/TokenExpiry`.
export default defineProApiHandler({}, async ({ db, caller }) => {
  const [dbUser] = await db
    .select({
      gscdumpUserId: users.gscdumpUserId,
    })
    .from(users)
    .where(eq(users.userId, caller.user.id))

  const account = await db
    .select()
    .from(googleAccounts)
    .where(and(eq(googleAccounts.userId, caller.user.id), eq(googleAccounts.type, 'auth')))
    .get()

  const tokens = account?.tokens
  const accessToken = tokens?.access_token ?? null
  const refreshToken = tokens?.refresh_token ?? null
  const tokenExpiryMs = tokens?.expiry_date ?? null

  if (!dbUser?.gscdumpUserId || !accessToken || !refreshToken) {
    throw createError({ statusCode: 400, message: 'No Google tokens available. Please reconnect your Google account.' })
  }

  const gscdump = useGscdumpClient()
  const tokenExpiryUnix = tokenExpiryMs ? Math.floor(tokenExpiryMs / 1000) : undefined

  const updated = await gscdump.updateUserTokens(dbUser.gscdumpUserId, {
    accessToken,
    refreshToken,
    tokenExpiresAt: tokenExpiryUnix!,
  }).catch((err) => {
    const upstreamStatus = err?.statusCode ?? err?.status
    const reason = err?.data?.reason || err?.data?.error
    const message = err?.data?.message || err?.message
    logger.error('[gsc-resync] gscdump token update failed:', { status: upstreamStatus, reason, message })
    throw createError({
      statusCode: upstreamStatus && upstreamStatus >= 400 && upstreamStatus < 600 ? upstreamStatus : 502,
      data: { reason: reason || 'RESYNC_FAILED', message },
      message: message || 'Failed to sync tokens with data provider. Your Google token may have expired. Please reconnect your Google account.',
    })
  })

  logger.log('[gsc-resync] tokens resynced for user:', dbUser.gscdumpUserId, `${updated.sites.length} sites accessible`)

  return {
    success: true,
    sitesAccessible: updated.sites.length,
  }
})

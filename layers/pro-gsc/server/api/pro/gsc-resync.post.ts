import { and, eq } from 'drizzle-orm'
import { logger } from '~~/shared/server/logger'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { probeGscdumpUserKey, shouldRepairGscdumpKey } from '#layers/pro-gsc/server/utils/gscdump-key-repair'
import { googleAccounts, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// Re-push stored Google tokens to gscdump without requiring a new OAuth flow.
// Useful when the initial token sync failed silently.
//
// V1: per-user Google tokens now live on `google_accounts` (type='auth'),
// not on `users.googleAccessToken/RefreshToken/TokenExpiry`.
export default defineProApiHandler({}, async ({ event, db, caller }) => {
  const [dbUser] = await db
    .select({
      gscdumpUserId: users.gscdumpUserId,
      gscdumpApiKey: users.gscdumpApiKey,
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

  // `account` is narrowed here, not just its tokens: the repair path below needs
  // the stored Google identity to re-register.
  if (!dbUser?.gscdumpUserId || !account || !accessToken || !refreshToken) {
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

  // Resync is where a user lands when the dashboard is broken, so it has to be
  // able to fix a broken credential too. Pushing tokens does not touch the API
  // key: `updateUserTokens` returns none, and a key that is present but dead
  // reads as healthy from here. Probe it, and re-mint only on an explicit
  // rejection so a transient failure cannot rotate a working key.
  let credentialRepaired = false
  const probe = dbUser.gscdumpApiKey
    ? await probeGscdumpUserKey(event, dbUser.gscdumpUserId, dbUser.gscdumpApiKey)
    : 'skipped'

  if (shouldRepairGscdumpKey({ storedKey: dbUser.gscdumpApiKey ?? null, probe })) {
    logger.warn('[gsc-resync] gscdump credential needs repair:', dbUser.gscdumpUserId, `probe=${probe}`)
    const reminted = await gscdump.registerUser({
      userGoogleId: account.payload.sub,
      userEmail: account.payload.email,
      userName: account.payload.name,
      accessToken,
      refreshToken,
      tokenExpiresAt: tokenExpiryUnix!,
    }).catch((err: unknown) => {
      logger.warn('[gsc-resync] gscdump api key remint failed:', err)
      return null
    })

    // A different user id would mean a second gscdump user exists for this
    // person; binding this account to it silently would be worse than leaving
    // the credential broken.
    if (reminted?.userId === dbUser.gscdumpUserId && reminted.apiKey) {
      await db.update(users)
        .set({ gscdumpApiKey: reminted.apiKey, updatedAt: Date.now() })
        .where(eq(users.userId, caller.user.id))
      credentialRepaired = true
      logger.log('[gsc-resync] gscdump api key reminted for:', dbUser.gscdumpUserId)
    }
    else if (reminted && reminted.userId !== dbUser.gscdumpUserId) {
      logger.error('[gsc-resync] gscdump remint returned a different user:', reminted.userId, 'expected', dbUser.gscdumpUserId)
    }
  }

  return {
    success: true,
    sitesAccessible: updated.sites.length,
    credentialRepaired,
  }
})

import { and, eq } from 'drizzle-orm'
import { revokeOAuthTokenResult } from 'gscdump'
import { defineEventHandler } from 'h3'
import { authenticateUser } from '~~/layers/core/server/app/utils/auth'
import { googleAccounts, users } from '~~/layers/core/server/db/schema'
import { logWarn } from '~~/shared/logging'

// Disconnects the pooled Google Indexing API grant (`google_accounts`,
// type='indexing'). Idempotent: calling this with nothing connected is a
// no-op success, matching DELETE semantics.
export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)
  const db = useDrizzle(event)

  const account = await db.query.googleAccounts.findFirst({
    where: and(eq(googleAccounts.userId, user.userId), eq(googleAccounts.type, 'indexing')),
  })

  if (!account) {
    return { status: 'ok' as const }
  }

  const revocationToken = account.tokens.refresh_token || account.tokens.access_token
  const revocation = await revokeOAuthTokenResult(revocationToken)
  if (!revocation.ok)
    logWarn('indexing.revoke_failed', revocation.error, { userId: user.userId })

  await db.delete(googleAccounts).where(eq(googleAccounts.googleAccountId, account.googleAccountId))

  // Keep a hint of which pooled OAuth client this user was on, so
  // reconnecting prefers the same client instead of claiming a new slot.
  await db.update(users)
    .set({ lastIndexingOAuthId: String(account.googleOAuthClientId) })
    .where(eq(users.userId, user.userId))

  return { status: 'ok' as const }
})

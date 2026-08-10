import { and, eq } from 'drizzle-orm'
import * as schema from '#layers/pro-saas/server/database'
import { getUserIdentities } from '../../utils/auth/identity'

// Pro account-page: list current user's identity rows + promotability hints.
// `googleIntegrationConnected` means the user has a GSC OAuth grant in
// `google_accounts` (type='auth') but no user_identities row for google yet —
// the State B / "promote" path. POST /api/auth/promote-integration-to-identity
// upgrades it without a second OAuth bounce.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const db = useDrizzle(event)

  const identities = await getUserIdentities(db, userId)
  const googleAccount = await db
    .select({ payload: schema.googleAccounts.payload })
    .from(schema.googleAccounts)
    .where(and(eq(schema.googleAccounts.userId, userId), eq(schema.googleAccounts.type, 'auth')))
    .get()

  const hasGoogleIdentity = identities.some(i => i.provider === 'google')
  const googleIntegrationConnected = !!googleAccount

  return {
    identities: identities.map(i => ({
      provider: i.provider,
      providerUserId: i.providerUserId,
      email: i.email,
      displayName: i.displayName,
      avatarUrl: i.avatarUrl,
      linkedAt: i.linkedAt?.toISOString() ?? null,
      lastUsedAt: i.lastUsedAt?.toISOString() ?? null,
    })),
    canPromoteGoogle: !hasGoogleIdentity && googleIntegrationConnected,
    googleIntegrationEmail: googleAccount?.payload?.email ?? null,
    activeProvider: session.user.authProvider,
  }
})

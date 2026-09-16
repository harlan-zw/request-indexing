import { eq } from 'drizzle-orm'
import { revokeDeveloperApiKey } from '#layers/pro-gsc/server/utils/developer-api-keys'
import { createGscdumpPublicV1Client } from '#layers/pro-gsc/server/utils/gscdump-origin'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// Revokes one of the caller's own API keys. gscdump scopes the key ID to the
// caller's gscdump user, so an ID from another person returns not found.
export default defineProApiHandler({}, async ({ db, caller, event }) => {
  const [user] = await db
    .select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, caller.user.id))
  return revokeDeveloperApiKey(createGscdumpPublicV1Client(event), user?.gscdumpUserId ?? null, getRouterParam(event, 'keyId'))
})

import { eq } from 'drizzle-orm'
import { listDeveloperApiKeys } from '#layers/pro-gsc/server/utils/developer-api-keys'
import { createGscdumpPublicV1Client } from '#layers/pro-gsc/server/utils/gscdump-origin'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// Lists the caller's own API keys. A key belongs to one person, so this never
// reads another Team member's keys.
export default defineProApiHandler({}, async ({ db, caller, event }) => {
  const [user] = await db
    .select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, caller.user.id))
  return listDeveloperApiKeys(createGscdumpPublicV1Client(event), user?.gscdumpUserId ?? null)
})

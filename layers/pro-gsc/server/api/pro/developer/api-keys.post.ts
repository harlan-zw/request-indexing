import { eq } from 'drizzle-orm'
import { createDeveloperApiKey, createDeveloperApiKeyBody } from '#layers/pro-gsc/server/utils/developer-api-keys'
import { createGscdumpPublicV1Client } from '#layers/pro-gsc/server/utils/gscdump-origin'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// Creates an API key for the caller. The response carries the raw key once;
// this app stores nothing about it.
export default defineProApiHandler({ body: createDeveloperApiKeyBody }, async ({ db, caller, event, body }) => {
  const [user] = await db
    .select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, caller.user.id))
  setResponseHeader(event, 'cache-control', 'no-store')
  setResponseStatus(event, 201)
  return createDeveloperApiKey(createGscdumpPublicV1Client(event), user?.gscdumpUserId ?? null, body)
})

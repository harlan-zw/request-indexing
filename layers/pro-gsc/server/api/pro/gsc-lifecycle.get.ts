import { eq } from 'drizzle-orm'
import { findLifecycleSite, useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

export default defineProApiHandler({}, async ({ db, caller, event }) => {
  const [user] = await db
    .select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, caller.user.id))

  if (!user?.gscdumpUserId)
    throw createError({ statusCode: 400, message: 'Not registered with gscdump' })

  const lifecycle = await useGscdumpClient().getUserLifecycle(user.gscdumpUserId)
  const query = getQuery(event)
  const siteId = typeof query.siteId === 'string' ? query.siteId : null

  return {
    lifecycle,
    site: siteId ? findLifecycleSite(lifecycle, siteId) : null,
  }
})

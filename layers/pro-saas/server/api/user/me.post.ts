import { eq } from 'drizzle-orm'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { profileUpdateSchema } from '#layers/pro-saas/shared/validators/account'

// Profile update: analytics dashboard preferences. These live on the `users`
// row only. The session user shape (`#auth-utils`) carries just routing
// identity (id/email/name/avatarUrl/currentTeamId), so there's nothing to
// re-seal here. Returns the session unchanged so the client can keep
// assigning the response straight back onto `session.value`.
export default defineProApiHandler({
  body: profileUpdateSchema,
}, async ({ event, db, caller, body }) => {
  const patch: { analyticsPeriod?: string, analyticsRange?: unknown, updatedAt: number } = {
    updatedAt: Date.now(),
  }
  if (body.analyticsPeriod !== undefined)
    patch.analyticsPeriod = body.analyticsPeriod
  if (body.analyticsRange !== undefined)
    patch.analyticsRange = body.analyticsRange

  await db.update(users)
    .set(patch)
    .where(eq(users.userId, caller.user.id))

  return await getUserSession(event)
})

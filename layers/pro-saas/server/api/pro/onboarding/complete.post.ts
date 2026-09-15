import { eq } from 'drizzle-orm'
import { sites, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { ProError } from '#layers/pro-saas/shared/errors'
import { resolveOnboardingCompletion } from '#layers/pro-saas/shared/onboarding'

/**
 * Close onboarding for the signed-in user.
 *
 * The flag is user scoped (`users.onboarding_completed_at`), so creating or
 * joining a second team never sends an onboarded person back through setup.
 * It also closes the gate permanently, which is why the decision refuses a
 * caller with no site: they would land on an empty dashboard with no route back.
 */
export default defineProApiHandler({ team: true }, async ({ db, caller, team: ctx, event }) => {
  const [user] = await db.select({ onboardingCompletedAt: users.onboardingCompletedAt })
    .from(users)
    .where(eq(users.userId, caller.user.id))

  const teamSite = await db.select({ id: sites.id })
    .from(sites)
    .where(eq(sites.teamId, ctx.team.teamId))
    .limit(1)

  const decision = resolveOnboardingCompletion({
    completedAt: user?.onboardingCompletedAt ?? null,
    hasSites: teamSite.length > 0,
    now: new Date(),
  })

  if (decision._tag === 'Blocked')
    throw new ProError('validation_failed', { message: decision.message })

  if (decision._tag === 'Complete') {
    await db.update(users)
      .set({ onboardingCompletedAt: new Date(decision.completedAt) })
      .where(eq(users.userId, caller.user.id))
  }

  // The gate reads `session.onboardingCompletedAt` on the very next render, so
  // a stale null here would bounce the just-finished user straight back in.
  await setUserSession(event, { onboardingCompletedAt: decision.completedAt })

  return { onboardingCompletedAt: decision.completedAt }
})

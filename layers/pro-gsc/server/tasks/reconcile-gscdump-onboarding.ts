import { and, isNotNull } from 'drizzle-orm'
import { users } from '#layers/pro-saas/server/database'
import { reconcileGscdumpOnboardingForUser } from '../utils/reconcile-gscdump-onboarding'

export default defineTask({
  meta: {
    name: 'pro:reconcile-gscdump-onboarding',
    description: 'Reconcile gscdump user readiness, team mirror, and unlinked team sites.',
  },
  async run(): Promise<{ result: { usersProcessed: number, attemptedSites: number, linkedSites: number } }> {
    const db = useDrizzle()
    const rows = await db.select({
      userId: users.userId,
      gscdumpUserId: users.gscdumpUserId,
      currentTeamId: users.currentTeamId,
    })
      .from(users)
      .where(and(
        isNotNull(users.gscdumpUserId),
        isNotNull(users.currentTeamId),
      ))
      .all()

    let attemptedSites = 0
    let linkedSites = 0

    for (const row of rows) {
      if (!row.gscdumpUserId)
        continue
      const result = await reconcileGscdumpOnboardingForUser({
        userId: row.userId,
        gscdumpUserId: row.gscdumpUserId,
        currentTeamId: row.currentTeamId,
        waitForReady: false,
      }).catch(() => null)
      attemptedSites += result?.attemptedSites ?? 0
      linkedSites += result?.linkedSites ?? 0
    }

    return { result: { usersProcessed: rows.length, attemptedSites, linkedSites } }
  },
})

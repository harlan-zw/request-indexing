import { and, between, eq, isNotNull, lt } from 'drizzle-orm'
import { proEvents, users } from '#layers/pro-saas/server/database'

const DAY_MS = 24 * 60 * 60 * 1000

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS)
}

export default defineTask({
  meta: {
    name: 'pro:lifecycle',
    description: 'Drives post-trial state transitions and engagement-triggered drip rescues',
  },
  async run() {
    const db = useDrizzle()
    const now = new Date()

    // 1. Day-2 stuck rescue: trial users in their first ~2 days who haven't
    //    connected GSC. trialEndsAt window 27d-28d from now picks the cohort.
    const day2Window = await db.select({
      id: users.userId,
      email: users.stripeEmail,
    })
      .from(users)
      .where(and(
        eq(users.subscriptionStatus, 'trial'),
        between(users.trialEndsAt, addDays(now, 27), addDays(now, 28)),
        isNotNull(users.stripeEmail),
      ))
      .all()

    const day2Stuck = await forEachSettled(day2Window, 'pro-lifecycle.day2', async (u) => {
      const hasGsc = await db.select({ id: proEvents.id })
        .from(proEvents)
        .where(and(
          eq(proEvents.userId, u.id),
          eq(proEvents.type, 'gsc_connected'),
        ))
        .get()
      if (hasGsc)
        return
      await queueDrip(db, u.email, 'trial', 1)
    })

    // 2. Day-14 mid-trial check-in.
    const day14Window = await db.select({
      id: users.userId,
      email: users.stripeEmail,
    })
      .from(users)
      .where(and(
        eq(users.subscriptionStatus, 'trial'),
        between(users.trialEndsAt, addDays(now, 15), addDays(now, 16)),
        isNotNull(users.stripeEmail),
      ))
      .all()

    const day14Checkin = await forEachSettled(day14Window, 'pro-lifecycle.day14', u =>
      queueDrip(db, u.email, 'trial', 2))

    // 3. Paused → read_only after 1 day grace. trialEndsAt is the proxy for
    //    when the pause kicked in (the trial ended without payment method).
    const pausedReady = await db.select({
      id: users.userId,
      email: users.stripeEmail,
    })
      .from(users)
      .where(and(
        eq(users.subscriptionStatus, 'paused'),
        lt(users.trialEndsAt, addDays(now, -1)),
      ))
      .all()

    const pausedToReadOnly = await forEachSettled(pausedReady, 'pro-lifecycle.pausedToReadOnly', u =>
      db.update(users)
        .set({ subscriptionStatus: 'read_only', readOnlyUntil: addDays(now, 14) })
        .where(eq(users.userId, u.id)))

    // 4. Read-only → archived. Sends the "archiving imminent" email at the
    //    moment of the flip (trial step 4).
    const readOnlyExpired = await db.select({
      id: users.userId,
      email: users.stripeEmail,
    })
      .from(users)
      .where(and(
        eq(users.subscriptionStatus, 'read_only'),
        lt(users.readOnlyUntil, now),
      ))
      .all()

    const readOnlyToArchived = await forEachSettled(readOnlyExpired, 'pro-lifecycle.readOnlyToArchived', async (u) => {
      await db.update(users)
        .set({ subscriptionStatus: 'archived', archivedAt: now })
        .where(eq(users.userId, u.id))
      await queueDrip(db, u.email, 'trial', 4)
    })

    // 5. Archived → data deletion warning at archivedAt + 76d (T-14 of the
    //    90-day deletion window). One-shot per user via the trial sequence
    //    upsert; safe to re-run.
    const deletionWarn = await db.select({
      id: users.userId,
      email: users.stripeEmail,
    })
      .from(users)
      .where(and(
        eq(users.subscriptionStatus, 'archived'),
        lt(users.archivedAt, addDays(now, -76)),
        isNotNull(users.stripeEmail),
      ))
      .all()

    const archivedDeleteWarn = await forEachSettled(deletionWarn, 'pro-lifecycle.archivedDeleteWarn', u =>
      queueDrip(db, u.email, 'trial', 5))

    return {
      result: `day2Stuck=${day2Stuck.ok}/${day2Window.length} day14=${day14Checkin.ok}/${day14Window.length} pausedToRO=${pausedToReadOnly.ok}/${pausedReady.length} ROtoArchived=${readOnlyToArchived.ok}/${readOnlyExpired.length} archivedWarn=${archivedDeleteWarn.ok}/${deletionWarn.length}`,
    }
  },
})

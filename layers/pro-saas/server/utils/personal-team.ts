// Personal-team backfill. Steady-state, every user gets a personal team via
// createUserWithPersonalTeam at signup. This helper exists for legacy users
// predating that helper and for explicit backfill scripts. It must not be
// called from read-shaped request handlers; if a request needs it, that is a
// signal we still have orphan users in production.

import type { Team } from '../database'
import { and, desc, eq } from 'drizzle-orm'
import { teams, userIdentities, users } from '../database'

export async function ensurePersonalTeam(
  db: ReturnType<typeof useDrizzle>,
  userId: number,
): Promise<Team | null> {
  const existing = await db.select().from(teams).where(and(eq(teams.ownerId, userId), eq(teams.personalTeam, true))).get()
  if (existing) {
    await db.update(users).set({ currentTeamId: existing.teamId }).where(eq(users.userId, userId))
    return existing
  }
  const user = await db.select().from(users).where(eq(users.userId, userId)).get()
  if (!user)
    return null
  const primaryIdentity = await db.select({ displayName: userIdentities.displayName })
    .from(userIdentities)
    .where(eq(userIdentities.userId, userId))
    .orderBy(desc(userIdentities.lastUsedAt))
    .get()
  const teamName = primaryIdentity?.displayName || 'My team'
  const inserted = await db.insert(teams).values({
    ownerId: userId,
    name: teamName,
    personalTeam: true,
  }).returning().get()
  await db.update(users).set({ currentTeamId: inserted.teamId }).where(eq(users.userId, userId))
  return inserted
}

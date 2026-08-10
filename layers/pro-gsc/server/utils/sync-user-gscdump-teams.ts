// Sync a freshly-connected gscdump identity into existing pro teams.
//
// Two passes:
//  1. Owned teams without a `gscdumpTeamId` → create the gscdump-side team and
//     persist the id (covers users who created pro teams before connecting gscdump).
//  2. Member-of teams that already have a `gscdumpTeamId` → addMember so gscdump's
//     `requireSiteAccess` authorizes the user on the team-share R2 path.
//
// Errors land in `notifications` via the mirror client; never thrown.

import type { H3Event } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { teamMemberships, teams, users } from '#layers/pro-saas/server/database'
import { useGscdumpTeamsClient } from './gscdump-teams-client'

export async function syncUserGscdumpTeams(event: H3Event | undefined, opts: {
  userId: number
  gscdumpUserId: string
}) {
  const { userId, gscdumpUserId } = opts
  const db = useDrizzle(event)
  const teamsClient = useGscdumpTeamsClient(event)

  // Pass 1 — own teams missing a gscdumpTeamId.
  const ownOrphans = await db.select({
    id: teams.teamId,
    name: teams.name,
    personalTeam: teams.personalTeam,
  })
    .from(teams)
    .where(and(eq(teams.ownerId, userId), isNull(teams.gscdumpTeamId)))
    .all()

  for (const team of ownOrphans) {
    const result = await teamsClient.createTeam(
      { ownerUserId: gscdumpUserId, name: team.name, personalTeam: team.personalTeam },
      { actorUserId: userId, proTeamId: team.id },
    )
    if (result?.team?.id) {
      await db.update(teams)
        .set({ gscdumpTeamId: result.team.id, updatedAt: Date.now() })
        .where(eq(teams.teamId, team.id))
    }
  }

  // Pass 2 — non-owned memberships in teams that have a gscdumpTeamId.
  const memberRows = await db.select({
    teamId: teams.teamId,
    gscdumpTeamId: teams.gscdumpTeamId,
    role: teamMemberships.role,
  })
    .from(teamMemberships)
    .innerJoin(teams, eq(teams.teamId, teamMemberships.teamId))
    .where(eq(teamMemberships.userId, userId))
    .all()

  for (const m of memberRows) {
    if (!m.gscdumpTeamId)
      continue
    await teamsClient.addMember(
      m.gscdumpTeamId,
      { userId: gscdumpUserId, role: m.role },
      { actorUserId: userId, proTeamId: m.teamId },
    )
  }
}

// Resolve a pro user's gscdump publicId from the users table.
export async function getGscdumpUserId(event: H3Event | undefined, userId: number): Promise<string | null> {
  const db = useDrizzle(event)
  const row = await db.select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, userId))
    .get()
  return row?.gscdumpUserId ?? null
}

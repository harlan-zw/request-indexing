// One-shot (re-runnable) backfill: mirror existing pro teams into gscdump.com.
//
// Idempotent — checks `gscdumpTeamId IS NULL` before creating, and gscdump's
// `addMember` returns `alreadyExisted: true` for existing membership rows.
// Run via `wrangler dev` `nitro tasks run pro:backfill-gscdump-teams` or the
// scheduled task console; safe to invoke repeatedly.
//
// Plan: `.claude/context/teams-b3-plan.md` "R2 — Pro mirroring → Backfill".

import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { sites, teamMemberships, teams, users } from '#layers/pro-saas/server/database'
import { useGscdumpTeamsClient } from '../utils/gscdump-teams-client'

interface BackfillSummary {
  teamsCreated: number
  teamsSkipped: number
  membersAdded: number
  membersSkipped: number
  sitesBound: number
  sitesSkipped: number
  errors: number
}

export default defineTask({
  meta: {
    name: 'pro:backfill-gscdump-teams',
    description: 'B3 R2: mirror pro teams/members/sites into gscdump.com. Idempotent.',
  },
  async run({ payload }: { payload?: { dryRun?: boolean } }): Promise<{ result: BackfillSummary }> {
    const summary: BackfillSummary = {
      teamsCreated: 0,
      teamsSkipped: 0,
      membersAdded: 0,
      membersSkipped: 0,
      sitesBound: 0,
      sitesSkipped: 0,
      errors: 0,
    }

    const dryRun = !!payload?.dryRun
    const db = useDrizzle()
    const teamsClient = useGscdumpTeamsClient()

    // Pass 1 — create gscdump teams for pro teams whose owner has gscdumpUserId.
    const ownerJoinedTeams = await db.select({
      teamId: teams.teamId,
      teamName: teams.name,
      personalTeam: teams.personalTeam,
      ownerId: teams.ownerId,
      gscdumpTeamId: teams.gscdumpTeamId,
      ownerGscdumpUserId: users.gscdumpUserId,
    })
      .from(teams)
      .innerJoin(users, eq(users.userId, teams.ownerId))
      .where(and(isNull(teams.gscdumpTeamId), isNotNull(users.gscdumpUserId)))
      .all()

    for (const t of ownerJoinedTeams) {
      if (!t.ownerGscdumpUserId) {
        summary.teamsSkipped += 1
        continue
      }
      if (dryRun) {
        summary.teamsCreated += 1
        continue
      }
      const result = await teamsClient.createTeam(
        { ownerUserId: t.ownerGscdumpUserId, name: t.teamName, personalTeam: t.personalTeam },
        { actorUserId: t.ownerId, proTeamId: t.teamId },
      )
      if (result?.team?.id) {
        await db.update(teams)
          .set({ gscdumpTeamId: result.team.id, updatedAt: new Date() })
          .where(eq(teams.teamId, t.teamId))
        summary.teamsCreated += 1
      }
      else {
        summary.errors += 1
      }
    }

    // Pass 2 — addMember for non-owner memberships where both user + team are linked.
    const memberRows = await db.select({
      proTeamId: teams.teamId,
      gscdumpTeamId: teams.gscdumpTeamId,
      memberUserId: teamMemberships.userId,
      memberGscdumpUserId: users.gscdumpUserId,
      role: teamMemberships.role,
    })
      .from(teamMemberships)
      .innerJoin(teams, eq(teams.teamId, teamMemberships.teamId))
      .innerJoin(users, eq(users.userId, teamMemberships.userId))
      .where(and(isNotNull(teams.gscdumpTeamId), isNotNull(users.gscdumpUserId)))
      .all()

    for (const m of memberRows) {
      if (!m.gscdumpTeamId || !m.memberGscdumpUserId) {
        summary.membersSkipped += 1
        continue
      }
      if (dryRun) {
        summary.membersAdded += 1
        continue
      }
      const result = await teamsClient.addMember(
        m.gscdumpTeamId,
        { userId: m.memberGscdumpUserId, role: m.role },
        { actorUserId: m.memberUserId, proTeamId: m.proTeamId },
      )
      if (result)
        summary.membersAdded += 1
      else
        summary.errors += 1
    }

    // Pass 3 — bind every pro site (with gscdumpSiteId) to its team's gscdumpTeamId.
    const siteRows = await db.select({
      siteId: sites.id,
      gscdumpSiteId: sites.gscdumpSiteId,
      ownerId: sites.userId,
      proTeamId: sites.teamId,
      gscdumpTeamId: teams.gscdumpTeamId,
      ownerGscdumpUserId: users.gscdumpUserId,
    })
      .from(sites)
      .innerJoin(teams, eq(teams.teamId, sites.teamId))
      .innerJoin(users, eq(users.userId, sites.userId))
      .where(and(
        isNotNull(sites.gscdumpSiteId),
        isNotNull(teams.gscdumpTeamId),
        isNotNull(users.gscdumpUserId),
      ))
      .all()

    for (const s of siteRows) {
      if (!s.gscdumpSiteId || !s.gscdumpTeamId || !s.ownerGscdumpUserId) {
        summary.sitesSkipped += 1
        continue
      }
      if (dryRun) {
        summary.sitesBound += 1
        continue
      }
      const result = await teamsClient.bindSiteToTeam(
        s.ownerGscdumpUserId,
        s.gscdumpSiteId,
        { teamId: s.gscdumpTeamId },
        { actorUserId: s.ownerId, proTeamId: s.proTeamId ?? null },
      )
      if (result)
        summary.sitesBound += 1
      else
        summary.errors += 1
    }

    return { result: summary }
  },
})

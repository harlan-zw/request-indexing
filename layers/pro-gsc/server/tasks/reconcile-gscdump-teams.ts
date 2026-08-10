// Hourly reconciliation: pro is the source of truth; converge gscdump-side
// memberships toward the pro-side state. Drift originates from mirror failures
// (transient gscdump 5xx, network blips) that landed in `notifications`.
//
// For every pro team with `gscdumpTeamId`:
//   1. Fetch gscdump-side members (publicId + role).
//   2. Fetch pro-side memberships (members + owner) joined to users.gscdumpUserId.
//   3. Diff:
//        pro∧gscdump same role  → no-op
//        pro∧gscdump diff role  → updateMemberRole
//        pro only               → addMember
//        gscdump only           → removeMember (pro is source of truth)
//   4. If unreconciled mismatches > 5 after the pass, write a `notifications` row.
//
// Cadence configurable via `runtimeConfig.proReconcileGscdumpTeamsCron`
// (open question 2 in the plan); default '0 * * * *' (hourly).

import type { GscdumpTeamMemberRow } from '@gscdump/sdk'
import { eq, isNotNull } from 'drizzle-orm'
import { logWarn } from '~~/shared/logging'
import { notifications, teamMemberships, teams, users } from '#layers/pro-saas/server/database'
import { useGscdumpTeamsClient } from '../utils/gscdump-teams-client'

const MAX_MISMATCHES_PER_TEAM = 5

interface TeamSummary {
  proTeamId: string
  gscdumpTeamId: string
  added: number
  removed: number
  roleChanged: number
  unreconciled: number
}

export default defineTask({
  meta: {
    name: 'pro:reconcile-gscdump-teams',
    description: 'B3 R2: hourly reconcile of pro team membership into gscdump.',
  },
  async run(): Promise<{ result: { teamsProcessed: number, summaries: TeamSummary[] } }> {
    const db = useDrizzle()
    const teamsClient = useGscdumpTeamsClient()

    const proTeams = await db.select({
      teamId: teams.teamId,
      gscdumpTeamId: teams.gscdumpTeamId,
      ownerId: teams.ownerId,
    })
      .from(teams)
      .where(isNotNull(teams.gscdumpTeamId))
      .all()

    const summaries: TeamSummary[] = []

    for (const t of proTeams) {
      if (!t.gscdumpTeamId)
        continue
      const summary: TeamSummary = {
        proTeamId: t.teamId,
        gscdumpTeamId: t.gscdumpTeamId,
        added: 0,
        removed: 0,
        roleChanged: 0,
        unreconciled: 0,
      }

      // gscdump-side members. listMembers throws on transient failure — skip the team.
      let gscdumpMembers: GscdumpTeamMemberRow[]
      try {
        gscdumpMembers = (await teamsClient.listMembers(t.gscdumpTeamId)).members
      }
      catch {
        summaries.push(summary)
        continue
      }

      // Pro-side memberships (excludes owner, who is implicit in gscdump too).
      const proMembers = await db.select({
        userId: teamMemberships.userId,
        role: teamMemberships.role,
        gscdumpUserId: users.gscdumpUserId,
      })
        .from(teamMemberships)
        .innerJoin(users, eq(users.userId, teamMemberships.userId))
        .where(eq(teamMemberships.teamId, t.teamId))
        .all()

      const proByGscdumpUserId = new Map<string, { userId: string, role: 'admin' | 'editor' | 'viewer' }>()
      for (const m of proMembers) {
        if (m.gscdumpUserId)
          proByGscdumpUserId.set(m.gscdumpUserId, { userId: m.userId, role: m.role })
      }

      const gscdumpByPublicId = new Map<string, GscdumpTeamMemberRow>()
      for (const m of gscdumpMembers)
        gscdumpByPublicId.set(m.publicId, m)

      // pro∧gscdump diff role  → update; pro only → add.
      for (const [publicId, pro] of proByGscdumpUserId) {
        const remote = gscdumpByPublicId.get(publicId)
        if (!remote) {
          const result = await teamsClient.addMember(
            t.gscdumpTeamId,
            { userId: publicId, role: pro.role },
            { actorUserId: pro.userId, proTeamId: t.teamId },
          )
          if (result)
            summary.added += 1
          else
            summary.unreconciled += 1
        }
        else if (remote.role !== pro.role) {
          const result = await teamsClient.updateMemberRole(
            t.gscdumpTeamId,
            publicId,
            { role: pro.role },
            { actorUserId: pro.userId, proTeamId: t.teamId },
          )
          if (result)
            summary.roleChanged += 1
          else
            summary.unreconciled += 1
        }
      }

      // gscdump only → remove (pro is source of truth).
      for (const [publicId] of gscdumpByPublicId) {
        if (proByGscdumpUserId.has(publicId))
          continue
        const result = await teamsClient.removeMember(
          t.gscdumpTeamId,
          publicId,
          { actorUserId: t.ownerId, proTeamId: t.teamId },
        )
        if (result)
          summary.removed += 1
        else
          summary.unreconciled += 1
      }

      if (summary.unreconciled > MAX_MISMATCHES_PER_TEAM) {
        await db.insert(notifications).values({
          userId: t.ownerId,
          teamId: t.teamId,
          type: 'gscdump-mirror-failed',
          channel: 'system',
          referenceType: 'gscdump-team',
          referenceId: t.teamId,
          status: 'failed',
          error: `Reconciliation: ${summary.unreconciled} unreconciled mismatches`,
          metadata: { op: 'reconcile', summary },
        }).catch((err) => {
          // Best-effort: failing to record the over-threshold notification must
          // not abort the rest of the reconciliation pass for other teams.
          logWarn('notification.insert_failed', err, { op: 'reconcile-gscdump-teams', teamId: t.teamId, summary })
        })
      }

      summaries.push(summary)
    }

    return { result: { teamsProcessed: summaries.length, summaries } }
  },
})

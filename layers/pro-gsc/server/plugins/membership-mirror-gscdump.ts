// Mirror pro membership mutations to the gscdump team partner endpoint.
// Pro-saas owns the canonical state; gscdump is a downstream replica.
// Errors are logged and swallowed by `defineProListener` — reconciliation
// cron repairs drift.

import type { AddPartnerTeamMemberParams } from '@gscdump/sdk'
import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { teams, users } from '#layers/pro-saas/server/database'
import { useGscdumpTeamsClient } from '../utils/gscdump-teams-client'

type GscdumpRole = AddPartnerTeamMemberParams['role']

async function resolveMirrorIds(event: H3Event, teamId: string, userId: string) {
  const db = useDrizzle(event)
  const target = await db.select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, userId))
    .get()
  if (!target?.gscdumpUserId)
    return null
  const team = await db.select({ gscdumpTeamId: teams.gscdumpTeamId })
    .from(teams)
    .where(eq(teams.teamId, teamId))
    .get()
  if (!team?.gscdumpTeamId)
    return null
  return { gscdumpUserId: target.gscdumpUserId, gscdumpTeamId: team.gscdumpTeamId }
}

export default defineProListeners([
  defineProListener('pro:membership:added', async ({ event, teamId, userId, role }) => {
    const ids = await resolveMirrorIds(event, teamId, userId)
    if (!ids)
      return
    await useGscdumpTeamsClient(event).addMember(
      ids.gscdumpTeamId,
      { userId: ids.gscdumpUserId, role: role as GscdumpRole },
      { actorUserId: userId, proTeamId: teamId },
    )
  }),
  defineProListener('pro:membership:removed', async ({ event, teamId, userId }) => {
    const ids = await resolveMirrorIds(event, teamId, userId)
    if (!ids)
      return
    await useGscdumpTeamsClient(event).removeMember(
      ids.gscdumpTeamId,
      ids.gscdumpUserId,
      { actorUserId: userId, proTeamId: teamId },
    )
  }),
  defineProListener('pro:membership:role-changed', async ({ event, teamId, userId, role }) => {
    const ids = await resolveMirrorIds(event, teamId, userId)
    if (!ids)
      return
    await useGscdumpTeamsClient(event).updateMemberRole(
      ids.gscdumpTeamId,
      ids.gscdumpUserId,
      { role: role as GscdumpRole },
      { actorUserId: userId, proTeamId: teamId },
    )
  }),
])

import type { H3Event } from 'h3'
import { eq } from 'drizzle-orm'
import { teams, users } from '#layers/pro-saas/server/database'

export async function resolveGscdumpMirrorIds(event: H3Event, teamId: number, userId: number) {
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

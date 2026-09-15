import type { TeamRole } from '#layers/pro-saas/server/database'
import { desc, inArray } from 'drizzle-orm'
import { userIdentities } from '#layers/pro-saas/server/database'
import { listTeamMembers } from '#layers/pro-saas/server/resources/team'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

interface MemberRow {
  userId: number
  role: TeamRole | 'owner'
  user: { name: string | null, email: string | null, avatar: string | null }
}

export default defineProApiHandler({ team: true }, async ({ team: ctx }): Promise<MemberRow[]> => {
  const { owner, members } = await listTeamMembers(ctx)

  const userIds = [...(owner ? [owner.id] : []), ...members.map(m => m.userId)]
  const avatarByUserId = new Map<number, string | null>()
  if (userIds.length) {
    const identityRows = await ctx.db.select({
      userId: userIdentities.userId,
      avatarUrl: userIdentities.avatarUrl,
    })
      .from(userIdentities)
      .where(inArray(userIdentities.userId, userIds))
      .orderBy(desc(userIdentities.lastUsedAt))
      .all()
    // First row per user wins (rows are ordered most-recently-used first).
    for (const row of identityRows) {
      if (!avatarByUserId.has(row.userId))
        avatarByUserId.set(row.userId, row.avatarUrl)
    }
  }

  const toRow = (userId: number, role: TeamRole | 'owner', user: { name: string | null, email: string | null }): MemberRow => ({
    userId,
    role,
    user: { name: user.name, email: user.email, avatar: avatarByUserId.get(userId) ?? null },
  })

  return [
    ...(owner ? [toRow(owner.id, 'owner', owner)] : []),
    ...members.map(m => toRow(m.userId, m.role, m.user)),
  ]
})

import type { CurrentTeamContext } from '../utils/require-current-team'
import { desc, eq, inArray } from 'drizzle-orm'
import { teamAuditEvents, teamInvitations, teamMemberships, userIdentities, users } from '../database'

// Map of user_id -> primary identity (most-recent by last_used_at). Used by the
// list-* helpers in this file to project displayName/email into `{name, email}`
// fields that the team-settings Vue consumes.
async function loadPrimaryIdentities(
  db: CurrentTeamContext['db'],
  userIds: number[],
): Promise<Map<number, { displayName: string | null, email: string | null }>> {
  const out = new Map<number, { displayName: string | null, email: string | null, lastUsedAt: number }>()
  if (!userIds.length)
    return new Map()
  const rows = await db.select({
    userId: userIdentities.userId,
    displayName: userIdentities.displayName,
    email: userIdentities.email,
    lastUsedAt: userIdentities.lastUsedAt,
  })
    .from(userIdentities)
    .where(inArray(userIdentities.userId, userIds))
    .all()
  for (const r of rows) {
    const ts = r.lastUsedAt?.getTime() ?? 0
    const existing = out.get(r.userId)
    if (!existing || ts > existing.lastUsedAt)
      out.set(r.userId, { displayName: r.displayName, email: r.email, lastUsedAt: ts })
  }
  return new Map(Array.from(out, ([k, v]) => [k, { displayName: v.displayName, email: v.email }]))
}

function projectIdentityUserShape(identity: { displayName: string | null, email: string | null } | undefined) {
  return {
    name: identity?.displayName ?? null,
    email: identity?.email ?? null,
  }
}

export async function listTeamMembers(ctx: CurrentTeamContext) {
  const baseMembers = await ctx.db
    .select({
      id: teamMemberships.teamMembershipId,
      userId: teamMemberships.userId,
      role: teamMemberships.role,
      createdAt: teamMemberships.createdAt,
      user: {
        id: users.userId,
      },
    })
    .from(teamMemberships)
    .innerJoin(users, eq(users.userId, teamMemberships.userId))
    .where(eq(teamMemberships.teamId, ctx.team.teamId))
    .all()

  const baseOwner = ctx.team.ownerId != null
    ? await ctx.db
        .select({
          id: users.userId,
        })
        .from(users)
        .where(eq(users.userId, ctx.team.ownerId))
        .get()
    : undefined

  const userIds = Array.from(new Set([
    ...baseMembers.map(m => m.user.id),
    ...(baseOwner ? [baseOwner.id] : []),
  ]))
  const identities = await loadPrimaryIdentities(ctx.db, userIds)

  const members = baseMembers.map(m => ({
    ...m,
    user: { ...m.user, ...projectIdentityUserShape(identities.get(m.user.id)) },
  }))
  const owner = baseOwner ? { ...baseOwner, ...projectIdentityUserShape(identities.get(baseOwner.id)) } : undefined

  return { owner, members }
}

export async function listPendingTeamInvitations(ctx: CurrentTeamContext) {
  const invitations = await ctx.db
    .select()
    .from(teamInvitations)
    .where(eq(teamInvitations.teamId, ctx.team.teamId))
    .all()

  return invitations.filter(i => !i.acceptedAt)
}

export async function listTeamAuditEvents(ctx: CurrentTeamContext, limit: number) {
  const base = await ctx.db
    .select({
      id: teamAuditEvents.teamAuditEventId,
      kind: teamAuditEvents.kind,
      targetType: teamAuditEvents.targetType,
      targetId: teamAuditEvents.targetId,
      metadata: teamAuditEvents.metadata,
      createdAt: teamAuditEvents.createdAt,
      actorUserId: teamAuditEvents.actorUserId,
      actorIdFromUsers: users.userId,
    })
    .from(teamAuditEvents)
    .leftJoin(users, eq(users.userId, teamAuditEvents.actorUserId))
    .where(eq(teamAuditEvents.teamId, ctx.team.teamId))
    .orderBy(desc(teamAuditEvents.createdAt))
    .limit(limit)
    .all()

  const actorIds = Array.from(new Set(base.map(r => r.actorIdFromUsers).filter((id): id is number => id != null)))
  const actorIdentities = await loadPrimaryIdentities(ctx.db, actorIds)

  return base.map((r) => {
    const actorId = r.actorIdFromUsers
    const actor = actorId
      ? { id: actorId, ...projectIdentityUserShape(actorIdentities.get(actorId)) }
      : null
    return {
      id: r.id,
      kind: r.kind,
      targetType: r.targetType,
      targetId: r.targetId,
      metadata: r.metadata,
      createdAt: r.createdAt,
      actorUserId: r.actorUserId,
      actor,
    }
  })
}

import type { ApiUsageSource, ApiUsageStatus } from '../database'
import type { CurrentTeamContext } from '../utils/require-current-team'
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm'
import { apiUsageEvents, teamApiTokens, teamAuditEvents, teamInvitations, teamMemberships, userIdentities, users } from '../database'

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

export async function listTeamApiTokens(ctx: CurrentTeamContext) {
  const where = ctx.can('manage-api-tokens')
    ? eq(teamApiTokens.teamId, ctx.team.teamId)
    : and(eq(teamApiTokens.teamId, ctx.team.teamId), eq(teamApiTokens.userId, ctx.caller.user.id))

  const rows = await ctx.db
    .select({
      id: teamApiTokens.teamApiTokenId,
      label: teamApiTokens.label,
      last4: teamApiTokens.last4,
      role: teamApiTokens.role,
      usageCount: teamApiTokens.usageCount,
      lastUsedAt: teamApiTokens.lastUsedAt,
      expiresAt: teamApiTokens.expiresAt,
      createdAt: teamApiTokens.createdAt,
      userId: teamApiTokens.userId,
    })
    .from(teamApiTokens)
    .where(where)
    .orderBy(desc(teamApiTokens.createdAt))

  const tokenUserIds = Array.from(new Set(rows.map(r => r.userId).filter((id): id is number => id != null)))
  const tokenIdentities = await loadPrimaryIdentities(ctx.db, tokenUserIds)

  const usageRows = rows.length
    ? await ctx.db
        .select({
          tokenId: apiUsageEvents.teamApiTokenId,
          requestCount: sql<number>`count(*)`,
          errorCount: sql<number>`sum(case when ${apiUsageEvents.status} = 'error' then 1 else 0 end)`,
          lastRequestAt: sql<Date | null>`max(${apiUsageEvents.createdAt})`,
        })
        .from(apiUsageEvents)
        .where(and(
          eq(apiUsageEvents.teamId, ctx.team.teamId),
          inArray(apiUsageEvents.teamApiTokenId, rows.map(r => r.id)),
        ))
        .groupBy(apiUsageEvents.teamApiTokenId)
        .all()
    : []
  const usageByToken = new Map(usageRows.map(r => [r.tokenId, r]))

  return rows.map(r => ({
    id: r.id,
    label: r.label,
    last4: r.last4,
    role: r.role,
    usageCount: r.usageCount,
    requestCount: usageByToken.get(r.id)?.requestCount ?? 0,
    errorCount: usageByToken.get(r.id)?.errorCount ?? 0,
    lastRequestAt: usageByToken.get(r.id)?.lastRequestAt ?? null,
    lastUsedAt: r.lastUsedAt,
    expiresAt: r.expiresAt,
    createdAt: r.createdAt,
    isMine: r.userId === ctx.caller.user.id,
    createdBy: (() => {
      const identity = r.userId ? tokenIdentities.get(r.userId) : undefined
      return {
        id: r.userId,
        name: identity?.displayName || identity?.email || 'Unknown',
      }
    })(),
  }))
}

export interface ListTeamApiUsageOptions {
  tokenId?: number | null
  source?: ApiUsageSource | null
  status?: ApiUsageStatus | null
  limit?: number
  cursor?: string | null
}

function parseUsageCursor(cursor: string | null | undefined): Date | null {
  if (!cursor)
    return null
  const asNumber = Number(cursor)
  const date = Number.isFinite(asNumber) ? new Date(asNumber) : new Date(cursor)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function listTeamApiUsage(ctx: CurrentTeamContext, options: ListTeamApiUsageOptions = {}) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100)
  const canManageAll = ctx.can('manage-api-tokens')
  const allowedTokenRows = await ctx.db
    .select({ id: teamApiTokens.teamApiTokenId })
    .from(teamApiTokens)
    .where(canManageAll
      ? eq(teamApiTokens.teamId, ctx.team.teamId)
      : and(eq(teamApiTokens.teamId, ctx.team.teamId), eq(teamApiTokens.userId, ctx.caller.user.id)))
    .all()
  const allowedTokenIds = allowedTokenRows.map(r => r.id)

  if (options.tokenId && !allowedTokenIds.includes(options.tokenId))
    return { events: [], nextCursor: null, aggregates: { totalEvents: 0, errors: 0, lastUsed: null, topActions: [], topTargets: [] } }

  const cursorDate = parseUsageCursor(options.cursor)
  const aggregateConditions = [
    eq(apiUsageEvents.teamId, ctx.team.teamId),
    options.source ? eq(apiUsageEvents.source, options.source) : undefined,
    options.status ? eq(apiUsageEvents.status, options.status) : undefined,
    options.tokenId
      ? eq(apiUsageEvents.teamApiTokenId, options.tokenId)
      : (!canManageAll && allowedTokenIds.length ? inArray(apiUsageEvents.teamApiTokenId, allowedTokenIds) : undefined),
  ].filter(Boolean) as NonNullable<Parameters<typeof and>[0]>[]
  const baseConditions = [
    ...aggregateConditions,
    cursorDate ? lt(apiUsageEvents.createdAt, cursorDate) : undefined,
  ].filter(Boolean) as NonNullable<Parameters<typeof and>[0]>[]

  if (!canManageAll && !allowedTokenIds.length)
    return { events: [], nextCursor: null, aggregates: { totalEvents: 0, errors: 0, lastUsed: null, topActions: [], topTargets: [] } }

  const where = and(...baseConditions)
  const events = await ctx.db
    .select({
      id: apiUsageEvents.apiUsageEventId,
      teamId: apiUsageEvents.teamId,
      teamApiTokenId: apiUsageEvents.teamApiTokenId,
      userId: apiUsageEvents.userId,
      source: apiUsageEvents.source,
      method: apiUsageEvents.method,
      path: apiUsageEvents.path,
      action: apiUsageEvents.action,
      target: apiUsageEvents.target,
      status: apiUsageEvents.status,
      statusCode: apiUsageEvents.statusCode,
      responseTime: apiUsageEvents.responseTime,
      client: apiUsageEvents.client,
      userAgent: apiUsageEvents.userAgent,
      errorCode: apiUsageEvents.errorCode,
      createdAt: apiUsageEvents.createdAt,
    })
    .from(apiUsageEvents)
    .where(where)
    .orderBy(desc(apiUsageEvents.createdAt))
    .limit(limit + 1)
    .all()

  const visibleEvents = events.slice(0, limit)
  const nextCursor = events.length > limit ? visibleEvents.at(-1)?.createdAt?.toISOString() ?? null : null
  const aggregateWhere = and(...aggregateConditions)

  const totals = await ctx.db
    .select({
      totalEvents: sql<number>`count(*)`,
      errors: sql<number>`sum(case when ${apiUsageEvents.status} = 'error' then 1 else 0 end)`,
      lastUsed: sql<Date | null>`max(${apiUsageEvents.createdAt})`,
    })
    .from(apiUsageEvents)
    .where(aggregateWhere)
    .get()

  const topActions = await ctx.db
    .select({ value: apiUsageEvents.action, count: sql<number>`count(*)` })
    .from(apiUsageEvents)
    .where(aggregateWhere)
    .groupBy(apiUsageEvents.action)
    .orderBy(sql`count(*) desc`)
    .limit(5)
    .all()

  const topTargets = await ctx.db
    .select({ value: apiUsageEvents.target, count: sql<number>`count(*)` })
    .from(apiUsageEvents)
    .where(aggregateWhere)
    .groupBy(apiUsageEvents.target)
    .orderBy(sql`count(*) desc`)
    .limit(5)
    .all()

  return {
    events: visibleEvents,
    nextCursor,
    aggregates: {
      totalEvents: totals?.totalEvents ?? 0,
      errors: totals?.errors ?? 0,
      lastUsed: totals?.lastUsed ?? null,
      topActions: topActions.filter(r => r.value).map(r => ({ value: r.value!, count: r.count })),
      topTargets: topTargets.filter(r => r.value).map(r => ({ value: r.value!, count: r.count })),
    },
  }
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

// Comprehensive per-user data purge for the pro D1 database.
//
// D1 does NOT enforce foreign keys by default, so cascade declarations on the
// schema are not load-bearing. Every per-user table is deleted explicitly,
// children before parents.
//
// Cross-system side-effects (Stripe cancel, gscdump partner DELETE, chat
// purge, admin audit log) live in `pro:user:deleting` (pre, critical) and
// `pro:user:deleted` (post, best-effort) listener plugins per ADR-0007.
//
// Pass `dryRun: true` to count rows that would be deleted without mutating.
// Returns a per-table summary suitable for storing in an audit log.

import type { H3Event } from 'h3'
import { eq, inArray, or, sql } from 'drizzle-orm'
import {
  feedback,
  mcpUsage,
  notifications,
  siteGroups,
  sites,
  teamApiTokens,
  teamAuditEvents,
  teamGscCredentials,
  teamInvitations,
  teamMemberships,
  teams,
  telemetryEvents,
  userIdentities,
  users,
} from '../database'
import { dispatchProEvent } from './dispatch'
import { getProLogger } from './handler'

export interface DeleteUserOptions {
  userId: number
  dryRun?: boolean
}

export interface DeleteUserResult {
  userId: number
  dryRun: boolean
  user: {
    id: number
    name: string | null
    email: string | null
    identities: Array<{ provider: string, email: string | null, displayName: string | null }>
    stripeEmail: string | null
    gscdumpUserId: string | null
  } | null
  deleted: Record<string, number>
  /** True only if the users row was actually removed (or dryRun was set). */
  ok: boolean
  warnings: string[]
}

export async function deleteUserData(event: H3Event, opts: DeleteUserOptions): Promise<DeleteUserResult> {
  const { userId, dryRun = false } = opts
  const db = useDrizzle(event)
  const warnings: string[] = []

  const [user] = await db.select().from(users).where(eq(users.userId, userId)).limit(1)
  if (!user) {
    return {
      userId,
      dryRun,
      user: null,
      deleted: {},
      ok: true, // already gone — treat as success so callers can move on
      warnings: ['User not found'],
    }
  }

  const identityRows = await db.select({
    provider: userIdentities.provider,
    email: userIdentities.email,
    displayName: userIdentities.displayName,
    lastUsedAt: userIdentities.lastUsedAt,
  })
    .from(userIdentities)
    .where(eq(userIdentities.userId, userId))
    .all()
    .catch(() => [])
  const sortedIdentities = [...identityRows].sort(
    (a, b) => (b.lastUsedAt?.getTime() ?? 0) - (a.lastUsedAt?.getTime() ?? 0),
  )
  const primaryIdentity = sortedIdentities[0] ?? null
  const primaryEmail = primaryIdentity?.email ?? user.stripeEmail ?? ''

  // Pre-hook: critical listeners (e.g. Stripe cancel, gscdump partner DELETE)
  // run BEFORE rows are purged so they can read the canonical row state. A
  // throw here aborts the delete entirely — the caller surfaces it as 5xx.
  if (!dryRun) {
    await dispatchProEvent(event, 'pro:user:deleting', {
      userId,
      email: primaryEmail,
      stripeCustomerId: user.stripeCustomerId ?? null,
      gscdumpUserId: user.gscdumpUserId ?? null,
      subscriptionId: user.subscriptionId ?? null,
      subscriptionStatus: user.subscriptionStatus ?? null,
    })
  }

  // Resolve every site this user owns up-front so child purges can scope by siteId.
  const userSites = await db.select({ id: sites.siteId }).from(sites).where(eq(sites.ownerId, userId))
  const siteIds = userSites.map(s => s.id)

  // Pre-resolve teams the user owns so cascading children can be scoped explicitly.
  // D1 doesn't enforce FK cascades, so we manually delete every team-scoped child row
  // for owned teams before deleting the team itself.
  const ownedTeamRows = await db.select({ id: teams.teamId }).from(teams).where(eq(teams.ownerId, userId))
  const ownedTeamIds = ownedTeamRows.map(t => t.id)

  // Build the delete plan: ordered list of (label, predicate, runner).
  // Children before parents; null-safe-skip when there are no parent ids.
  const plan: Array<{ table: string, count: () => Promise<number>, run?: () => Promise<unknown> }> = [
    {
      table: 'sites',
      count: () => scalar(db, sql`select count(*) as c from sites where owner_id = ${userId}`),
      run: () => db.delete(sites).where(eq(sites.ownerId, userId)),
    },
    {
      table: 'site_groups',
      count: () => ownedTeamIds.length ? scalar(db, sql`select count(*) as c from site_groups where team_id in ${idList(ownedTeamIds)}`) : Promise.resolve(0),
      run: () => ownedTeamIds.length ? db.delete(siteGroups).where(inArray(siteGroups.teamId, ownedTeamIds)) : Promise.resolve(),
    },
    {
      table: 'pro_mcp_usage',
      count: () => scalar(db, sql`select count(*) as c from pro_mcp_usage where user_id = ${userId}`),
      run: () => db.delete(mcpUsage).where(eq(mcpUsage.userId, userId)),
    },
    {
      table: 'notifications',
      count: () => scalar(db, sql`select count(*) as c from notifications where user_id = ${userId}`),
      run: () => db.delete(notifications).where(eq(notifications.userId, userId)),
    },
    {
      table: 'feedback',
      count: () => scalar(db, sql`select count(*) as c from feedback where user_id = ${userId}`),
      // feedback is set-null on cascade; preserve the row, blank the user pointer.
      run: () => db.update(feedback).set({ userId: null }).where(eq(feedback.userId, userId)),
    },
    {
      table: 'telemetry_events',
      count: () => scalar(db, sql`select count(*) as c from telemetry_events where user_id = ${userId}`),
      run: () => db.update(telemetryEvents).set({ userId: null }).where(eq(telemetryEvents.userId, userId)),
    },
    {
      table: 'team_api_tokens',
      count: () => scalar(db, sql`select count(*) as c from team_api_tokens where user_id = ${userId}${ownedTeamIds.length ? sql` or team_id in ${idList(ownedTeamIds)}` : sql``}`),
      run: () => db.delete(teamApiTokens).where(
        ownedTeamIds.length
          ? or(eq(teamApiTokens.userId, userId), inArray(teamApiTokens.teamId, ownedTeamIds))
          : eq(teamApiTokens.userId, userId),
      ),
    },
    {
      table: 'team_gsc_credentials',
      count: () => scalar(db, sql`select count(*) as c from team_gsc_credentials where user_id = ${userId}${ownedTeamIds.length ? sql` or team_id in ${idList(ownedTeamIds)}` : sql``}`),
      run: () => db.delete(teamGscCredentials).where(
        ownedTeamIds.length
          ? or(eq(teamGscCredentials.userId, userId), inArray(teamGscCredentials.teamId, ownedTeamIds))
          : eq(teamGscCredentials.userId, userId),
      ),
    },
    {
      table: 'team_invitations',
      count: () => scalar(db, sql`select count(*) as c from team_invitations where invited_by_id = ${userId}${ownedTeamIds.length ? sql` or team_id in ${idList(ownedTeamIds)}` : sql``}`),
      run: () => db.delete(teamInvitations).where(
        ownedTeamIds.length
          ? or(eq(teamInvitations.invitedById, userId), inArray(teamInvitations.teamId, ownedTeamIds))
          : eq(teamInvitations.invitedById, userId),
      ),
    },
    {
      table: 'team_memberships',
      count: () => scalar(db, sql`select count(*) as c from team_memberships where user_id = ${userId}${ownedTeamIds.length ? sql` or team_id in ${idList(ownedTeamIds)}` : sql``}`),
      run: () => db.delete(teamMemberships).where(
        ownedTeamIds.length
          ? or(eq(teamMemberships.userId, userId), inArray(teamMemberships.teamId, ownedTeamIds))
          : eq(teamMemberships.userId, userId),
      ),
    },
    {
      table: 'team_audit_events_actor_nullified',
      count: () => scalar(db, sql`select count(*) as c from team_audit_events where actor_user_id = ${userId}`),
      // Schema declares actorUserId as set-null on user delete; preserve the audit trail.
      run: () => db.update(teamAuditEvents).set({ actorUserId: null }).where(eq(teamAuditEvents.actorUserId, userId)),
    },
    {
      table: 'team_audit_events',
      count: () => ownedTeamIds.length ? scalar(db, sql`select count(*) as c from team_audit_events where team_id in ${idList(ownedTeamIds)}`) : Promise.resolve(0),
      run: () => ownedTeamIds.length ? db.delete(teamAuditEvents).where(inArray(teamAuditEvents.teamId, ownedTeamIds)) : Promise.resolve(),
    },
    {
      table: 'teams',
      count: () => Promise.resolve(ownedTeamIds.length),
      run: () => ownedTeamIds.length ? db.delete(teams).where(inArray(teams.teamId, ownedTeamIds)) : Promise.resolve(),
    },
    {
      table: 'user_identities',
      count: () => scalar(db, sql`select count(*) as c from user_identities where user_id = ${userId}`),
      run: () => db.delete(userIdentities).where(eq(userIdentities.userId, userId)),
    },
    {
      table: 'users',
      count: () => Promise.resolve(1),
      run: () => db.delete(users).where(eq(users.userId, userId)),
    },
  ]

  // Touch siteIds so unused-var lint doesn't trip; reserved for future child purges.
  void siteIds

  const deleted: Record<string, number> = {}
  for (const step of plan) {
    const before = await step.count().catch((err) => {
      warnings.push(`count ${step.table}: ${(err as Error).message}`)
      return 0
    })
    deleted[step.table] = before
    if (!dryRun && step.run && before > 0) {
      await step.run().catch((err) => {
        warnings.push(`delete ${step.table}: ${(err as Error).message}`)
      })
    }
  }

  // Verify the users row is actually gone — otherwise re-login via OAuth will
  // restore the account by github_id match and the "delete" was a lie.
  let ok = true
  if (!dryRun) {
    const remaining = await scalar(db, sql`select count(*) as c from users where user_id = ${userId}`).catch(() => -1)
    if (remaining !== 0) {
      ok = false
      warnings.push(`users row still present after delete (count=${remaining})`)
    }
  }

  // Post-hook: best-effort listeners (audit log, async cleanup). Errors are
  // swallowed inside listener plugins; never propagate to the caller.
  if (!dryRun && ok) {
    await dispatchProEvent(event, 'pro:user:deleted', {
      userId,
      email: primaryEmail,
      stripeCustomerId: user.stripeCustomerId ?? null,
      gscdumpUserId: user.gscdumpUserId ?? null,
    }).catch((err: unknown) => {
      getProLogger(event).error('pro:user:deleted hook failed', err)
    })
  }

  return {
    userId,
    dryRun,
    user: {
      id: user.userId,
      name: primaryIdentity?.displayName ?? null,
      email: primaryIdentity?.email ?? null,
      identities: sortedIdentities.map(i => ({
        provider: i.provider,
        email: i.email,
        displayName: i.displayName,
      })),
      stripeEmail: user.stripeEmail,
      gscdumpUserId: user.gscdumpUserId,
    },
    deleted,
    ok,
    warnings,
  }
}

function idList(ids: number[]) {
  // Drizzle's inArray works for delete/update; for raw scalar count we hand-build the SQL list.
  return sql`(${sql.join(ids.map(id => sql`${id}`), sql`, `)})`
}

async function scalar(db: ReturnType<typeof useDrizzle>, query: ReturnType<typeof sql>): Promise<number> {
  const rows = await db.all<{ c: number }>(query)
  return Number((rows as any)[0]?.c ?? 0)
}

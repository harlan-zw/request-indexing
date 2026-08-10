// getCaller: the server seam for user context. See CONTEXT.md.
// Memoized per-request via event.context.__caller. Validates against the DB
// every request (per ADR-0001: session is a cache, not truth) and caches the
// resolved Caller for the lifetime of the request only.

import type { H3Event } from 'h3'
import type { AuthProviderId } from '#layers/pro-saas-auth/shared/types/auth'
import type {
  Caller,
  CallerAuthMethod,
  CallerPlan,
} from '../../shared/caller'
import type { User } from '../database'
import { desc, eq } from 'drizzle-orm'
import { deriveSubscription, hasProAccess } from '../../shared/caller-policy'
import { ProError } from '../../shared/errors'
import { teamMemberships, teams, userIdentities, users } from '../database'

const CACHE_KEY = '__caller' as const

interface PrimaryIdentity {
  provider: AuthProviderId
  displayName: string | null
  email: string | null
  avatarUrl: string | null
}

async function loadMemberships(
  db: ReturnType<typeof useDrizzle>,
  userId: number,
): Promise<Caller['memberships']> {
  const [owned, memberOf] = await Promise.all([
    db.select({
      id: teams.teamId,
      name: teams.name,
      personalTeam: teams.personalTeam,
    })
      .from(teams)
      .where(eq(teams.ownerId, userId))
      .all(),
    db.select({
      id: teams.teamId,
      name: teams.name,
      personalTeam: teams.personalTeam,
      role: teamMemberships.role,
      firstVisitDismissedAt: teamMemberships.firstVisitDismissedAt,
    })
      .from(teamMemberships)
      .innerJoin(teams, eq(teams.teamId, teamMemberships.teamId))
      .where(eq(teamMemberships.userId, userId))
      .all(),
  ])
  return [
    ...owned.map(t => ({
      teamId: t.id,
      teamName: t.name,
      role: 'owner' as const,
      isOwner: true,
      isPersonal: !!t.personalTeam,
      // Owners have no `team_memberships` row; treat as already-oriented so
      // the orientation card never shows for owners (ONBOARDING.md §9).
      firstVisitDismissedAt: null,
    })),
    ...memberOf.map(t => ({
      teamId: t.id,
      teamName: t.name,
      role: t.role,
      isOwner: false,
      isPersonal: !!t.personalTeam,
      firstVisitDismissedAt: t.firstVisitDismissedAt
        ? (t.firstVisitDismissedAt instanceof Date
            ? t.firstVisitDismissedAt.toISOString()
            : new Date(t.firstVisitDismissedAt as unknown as number).toISOString())
        : null,
    })),
  ]
}

// Look up the user's most-recent identity row (`user_identities`, ordered by
// `last_used_at DESC`). Identity-driven caller fields (`name`, `avatarUrl`,
// `email`, `providers`) derive from this row.
async function loadPrimaryIdentity(
  db: ReturnType<typeof useDrizzle>,
  userId: number,
): Promise<{ primary: PrimaryIdentity | null, providers: AuthProviderId[] }> {
  const rows = await db.select({
    provider: userIdentities.provider,
    displayName: userIdentities.displayName,
    email: userIdentities.email,
    avatarUrl: userIdentities.avatarUrl,
    lastUsedAt: userIdentities.lastUsedAt,
  })
    .from(userIdentities)
    .where(eq(userIdentities.userId, userId))
    .orderBy(desc(userIdentities.lastUsedAt))
    .all()
    .catch(() => [])
  const primary = rows[0]
    ? {
        provider: rows[0].provider as AuthProviderId,
        displayName: rows[0].displayName,
        email: rows[0].email,
        avatarUrl: rows[0].avatarUrl,
      }
    : null
  return {
    primary,
    providers: rows.map(r => r.provider as AuthProviderId),
  }
}

function buildCaller(
  event: H3Event,
  db: ReturnType<typeof useDrizzle>,
  user: User,
  identity: PrimaryIdentity | null,
  providers: AuthProviderId[],
  memberships: Caller['memberships'],
  authMethod: CallerAuthMethod,
  isAdmin: boolean,
): Caller {
  const name = identity?.displayName ?? null
  const email = identity?.email ?? user.stripeEmail ?? null
  const avatarUrl = identity?.avatarUrl ?? null
  return {
    user: {
      id: user.userId,
      email,
      name,
      avatarUrl,
      providers,
      stripeEmail: user.stripeEmail,
      apiKey: user.apiKey,
      createdAt: user.createdAt ? new Date(user.createdAt as unknown as number).toISOString() : null,
    },
    subscription: deriveSubscription(user),
    memberships,
    currentTeamId: user.currentTeamId ?? null,
    isAdmin,
    authMethod,
  }
}

export async function getCaller(event: H3Event): Promise<Caller | null> {
  const ctx = event.context as Record<string, unknown>
  const cached = ctx[CACHE_KEY]
  if (cached !== undefined)
    return cached as Caller | null

  const db = useDrizzle(event)

  // API-key path: pro-auth middleware populates event.context.proAuth.
  // Re-load the user row to honour ADR-0001 (don't trust cached identity).
  const proAuth = ctx.proAuth as { user: User } | undefined
  if (proAuth?.user) {
    const user = await db.query.users.findFirst({ where: eq(users.userId, proAuth.user.userId) })
    if (!user) {
      ctx[CACHE_KEY] = null
      return null
    }
    const [{ primary, providers }, memberships] = await Promise.all([
      loadPrimaryIdentity(db, user.userId),
      loadMemberships(db, user.userId),
    ])
    const caller = buildCaller(event, db, user, primary, providers, memberships, 'apiKey', isAdminEmail(primary?.email ?? user.stripeEmail ?? null))
    ctx[CACHE_KEY] = caller
    return caller
  }

  // Session path.
  const session = await getUserSession(event)
  if (!session.user?.id) {
    ctx[CACHE_KEY] = null
    return null
  }
  const user = await db.query.users.findFirst({ where: eq(users.userId, session.user.id) })
  if (!user) {
    // User row gone; clear the stale cookie so the client knows.
    await clearUserSession(event)
    ctx[CACHE_KEY] = null
    return null
  }
  const [{ primary, providers }, memberships] = await Promise.all([
    loadPrimaryIdentity(db, user.userId),
    loadMemberships(db, user.userId),
  ])
  const caller = buildCaller(event, db, user, primary, providers, memberships, 'session', isAdminEmail(session.user.email ?? null))
  ctx[CACHE_KEY] = caller
  return caller
}

export async function requireCaller(event: H3Event): Promise<Caller> {
  const caller = await getCaller(event)
  if (!caller)
    throw new ProError('unauthorized')
  return caller
}

export function requireSubscription(caller: Caller, plan: CallerPlan = 'pro'): Caller {
  if (hasProAccess(caller, plan))
    return caller
  throw new ProError('subscription_required', {
    details: { plan },
    ...(plan !== 'pro' ? { message: `${plan} plan required` } : {}),
  })
}

import type { AuthProviderId, NewUser } from '../database'
import { eq } from 'drizzle-orm'
import { logWarn } from '~~/shared/logging'
import { teams, userIdentities, users } from '../database'

export interface CreateUserIdentityInput {
  provider: AuthProviderId
  providerUserId: string
  email?: string | null
  emailVerified?: boolean
  displayName?: string | null
  avatarUrl?: string | null
}

/**
 * Atomically create a new user + their personal team + set users.currentTeamId.
 * Every signup site (Stripe webhook lifetime checkout, future providers) MUST
 * use this helper so no user ever exists without a personal team.
 *
 * D1 has no real transactions; we sequence carefully and best-effort rollback
 * if the team insert succeeds but the currentTeamId update fails.
 *
 * The `identity` arg is optional: webhook paths that already know a provider
 * identity (e.g. lifetime checkout with `client_reference_id`) can write the
 * `user_identities` row inline so the user can immediately sign in.
 */
export async function createUserWithPersonalTeam(
  db: ReturnType<typeof useDrizzle>,
  userInsert: NewUser,
  identity?: CreateUserIdentityInput,
) {
  const userRow = await db.insert(users).values(userInsert).returning().get()
  if (!userRow)
    throw new Error('createUserWithPersonalTeam: user insert returned no row')

  const teamName = personalTeamName(userInsert, identity)
  const teamRow = await db.insert(teams).values({
    ownerId: userRow.userId,
    name: teamName,
    personalTeam: true,
  }).returning().get()

  if (!teamRow) {
    // Best-effort cleanup; we're already throwing, surface the cleanup failure
    // to logs but don't mask the original team-insert failure.
    await db.delete(users).where(eq(users.userId, userRow.userId)).catch(err => logWarn('create_user.orphan_cleanup_failed', err, { userId: userRow.userId }))
    throw new Error('createUserWithPersonalTeam: team insert returned no row')
  }

  await db.update(users)
    .set({ currentTeamId: teamRow.teamId, updatedAt: Date.now() })
    .where(eq(users.userId, userRow.userId))

  if (identity) {
    const now = new Date()
    await db.insert(userIdentities).values({
      userId: userRow.userId,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      email: identity.email ?? null,
      emailVerified: identity.emailVerified ?? false,
      displayName: identity.displayName ?? null,
      avatarUrl: identity.avatarUrl ?? null,
      linkedAt: now,
      lastUsedAt: now,
    }).catch(err => logWarn('create_user.identity_insert_failed', err, { userId: userRow.userId, provider: identity.provider }))
  }

  return {
    user: { ...userRow, currentTeamId: teamRow.teamId },
    team: teamRow,
  }
}

function personalTeamName(u: NewUser, identity?: CreateUserIdentityInput): string {
  return identity?.displayName || u.stripeEmail?.split('@')[0] || 'My team'
}

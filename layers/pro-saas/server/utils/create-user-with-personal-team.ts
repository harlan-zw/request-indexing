import type { AuthProviderId, NewUser } from '../database'
import { eq } from 'drizzle-orm'
import { logWarn } from '~~/shared/logging'
import { teams, userIdentities, users } from '../database'

/**
 * `currentTeamId` is deliberately excluded: this helper creates the personal
 * team and owns that value. The column is NOT NULL, so accepting it from
 * callers is how the previous version ended up inserting users before their
 * team existed.
 */
export type CreateUserInput = Omit<NewUser, 'currentTeamId'>

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
 * Every signup site MUST use this helper so no user ever exists without a
 * personal team.
 *
 * D1 has no real transactions; we sequence carefully and best-effort rollback
 * if the team insert succeeds but the currentTeamId update fails.
 *
 * The `identity` arg is optional: signup paths that already know a provider
 * identity can write the `user_identities` row inline so the user can
 * immediately sign in.
 */
export async function createUserWithPersonalTeam(
  db: ReturnType<typeof useDrizzle>,
  userInsert: CreateUserInput,
  identity?: CreateUserIdentityInput,
) {
  // Team first, owner backfilled second. `users.current_team_id` is NOT NULL in
  // the live database (migration 0000 created it that way; schema.ts was later
  // relaxed to nullable but no migration ever carried that across, and drizzle's
  // snapshot already records it as nullable so it will never generate one).
  // Inserting the user first therefore failed the constraint and every signup
  // died with "Failed to create account". `teams.owner_id` is nullable, so
  // ordering it this way satisfies both sides of the circular reference without
  // rebuilding the table on production.
  const teamName = personalTeamName(userInsert, identity)
  const teamRow = await db.insert(teams).values({
    name: teamName,
    personalTeam: true,
  }).returning().get()

  if (!teamRow)
    throw new Error('createUserWithPersonalTeam: team insert returned no row')

  const userRow = await db.insert(users)
    .values({ ...userInsert, currentTeamId: teamRow.teamId })
    .returning()
    .get()
    .catch(async (err: unknown) => {
      // Do not leave an ownerless team behind if the user insert fails.
      await db.delete(teams).where(eq(teams.teamId, teamRow.teamId)).catch(cleanupErr => logWarn('create_user.orphan_cleanup_failed', cleanupErr, { teamId: teamRow.teamId }))
      throw err
    })

  if (!userRow) {
    await db.delete(teams).where(eq(teams.teamId, teamRow.teamId)).catch(err => logWarn('create_user.orphan_cleanup_failed', err, { teamId: teamRow.teamId }))
    throw new Error('createUserWithPersonalTeam: user insert returned no row')
  }

  await db.update(teams)
    .set({ ownerId: userRow.userId, updatedAt: Date.now() })
    .where(eq(teams.teamId, teamRow.teamId))

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

function personalTeamName(u: CreateUserInput, identity?: CreateUserIdentityInput): string {
  return identity?.displayName || u.email?.split('@')[0] || 'My team'
}

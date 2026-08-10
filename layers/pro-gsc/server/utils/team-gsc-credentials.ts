import type { H3Event } from 'h3'
import { and, eq } from 'drizzle-orm'
import { teamGscCredentials, users } from '~~/layers/core/server/db/schema'

/**
 * Lazy seam between `users.gscdump*` (core: per-user gscdump partner creds,
 * minted at sign-up) and `team_gsc_credentials` (pro-saas: per (team, user)
 * pool view used by pro-gsc analytics queries).
 *
 * Idempotent: a row for `(teamId, userId)` is the unique key. If both gscdump
 * fields on the user are populated and no row exists yet, this inserts one
 * with status='active'. Otherwise no-op.
 *
 * Call sites:
 * - on first pro-gsc read for a team (lazy backfill)
 * - on team join / team switch
 * - on gscdump re-registration (status='active' on conflict)
 */
export async function ensureTeamGscCredential(
  event: H3Event,
  args: { userId: number, teamId: number, label?: string | null },
): Promise<void> {
  const db = useDrizzle(event)

  const userRow = await db
    .select({
      gscdumpUserId: users.gscdumpUserId,
      gscdumpApiKey: users.gscdumpApiKey,
    })
    .from(users)
    .where(eq(users.userId, args.userId))
    .get()

  if (!userRow?.gscdumpUserId || !userRow.gscdumpApiKey)
    return

  await db
    .insert(teamGscCredentials)
    .values({
      teamId: args.teamId,
      userId: args.userId,
      gscdumpUserId: userRow.gscdumpUserId,
      gscdumpApiKey: userRow.gscdumpApiKey,
      label: args.label ?? null,
      status: 'active',
    })
    .onConflictDoUpdate({
      target: [teamGscCredentials.teamId, teamGscCredentials.userId],
      set: {
        gscdumpUserId: userRow.gscdumpUserId,
        gscdumpApiKey: userRow.gscdumpApiKey,
        status: 'active',
      },
    })
}

export async function resolveTeamGscCredential(
  event: H3Event,
  args: { teamId: number, userId?: number },
): Promise<{ gscdumpUserId: string, gscdumpApiKey: string } | null> {
  const db = useDrizzle(event)
  const whereClause = args.userId
    ? and(eq(teamGscCredentials.teamId, args.teamId), eq(teamGscCredentials.userId, args.userId))
    : eq(teamGscCredentials.teamId, args.teamId)

  const row = await db
    .select({
      gscdumpUserId: teamGscCredentials.gscdumpUserId,
      gscdumpApiKey: teamGscCredentials.gscdumpApiKey,
      status: teamGscCredentials.status,
    })
    .from(teamGscCredentials)
    .where(whereClause)
    .get()

  if (!row || row.status !== 'active')
    return null
  return { gscdumpUserId: row.gscdumpUserId, gscdumpApiKey: row.gscdumpApiKey }
}

import { eq } from 'drizzle-orm'
import { users } from '~~/layers/core/server/db/schema'
import { logWarn } from '~~/shared/logging'
import { useAuthHooks } from '#layers/pro-saas-auth/server/utils/auth/hooks'
import { ensureTeamGscCredential } from '../utils/team-gsc-credentials'

/**
 * Backfill `team_gsc_credentials` from `users.gscdump*` whenever an identity
 * resolves to a current team. Idempotent (the helper uses ON CONFLICT). Runs
 * lazily on every sign-in so newly-minted gscdump creds reach the team pool
 * without a separate cron.
 */
export default defineNitroPlugin(() => {
  const hooks = useAuthHooks()

  const handle = async (ctx: { event: import('h3').H3Event, user: { id: number } }) => {
    const db = useDrizzle(ctx.event)
    const row = await db
      .select({ currentTeamId: users.currentTeamId })
      .from(users)
      .where(eq(users.userId, ctx.user.id))
      .get()

    if (!row?.currentTeamId)
      return
    await ensureTeamGscCredential(ctx.event, { userId: ctx.user.id, teamId: row.currentTeamId })
      .catch(err => logWarn('pro_gsc.credential_sync_failed', err, { userId: ctx.user.id, teamId: row.currentTeamId }))
  }

  hooks.hook('user:created', handle)
  hooks.hook('user:signed-in', handle)
  hooks.hook('user:identity-linked', handle)
})

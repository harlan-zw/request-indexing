import { logger } from '~~/shared/server/logger'
import { useAuthHooks } from '#layers/pro-saas-auth/server/utils/auth/hooks'
import { ensurePersonalTeam } from '../utils/personal-team'

// pro-saas auth-hooks subscriber: every newly-created user gets a personal
// team + onboarding state. Best-effort: failures here don't block sign-in
// (matches the createUserWithPersonalTeam convention — sequenced writes,
// log on failure, the user can recover on next request).
export default defineNitroPlugin((nitroApp) => {
  const hooks = useAuthHooks()

  hooks.hook('user:created', async (ctx) => {
    const { event, user, identity } = ctx
    const db = useDrizzle(event)
    try {
      const team = await ensurePersonalTeam(db, user.id)
      if (!team)
        logger.error('[auth-hooks/pro-saas] ensurePersonalTeam returned null for new user:', user.id)
    }
    catch (err) {
      logger.error('[auth-hooks/pro-saas] team attach failed:', err)
    }
    // Onboarding state init removed during port; onboarding flow deleted in
    // 00-pro-saas.md Phase 1. Re-add a V1-shaped onboarding hook here if a
    // replacement onboarding wizard is built.
    // Touch — identity is referenced for future logging context.
    void identity
    void nitroApp
  })
})

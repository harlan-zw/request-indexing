import { z } from 'zod'
import { useAuthHooks } from '../../utils/auth/hooks'
import { disconnectIdentity } from '../../utils/auth/identity'

const Body = z.object({
  provider: z.enum(['github', 'google']),
})

// Disconnect an identity from the current user. Orphan guard prevents removing
// the last sign-in method. If the user disconnects their currently-active
// identity, we force a sign-out so the next request lands on the login page
// where they can re-authenticate with the remaining provider.
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const { provider } = await readValidatedBody(event, Body.parse)

  const db = useDrizzle(event)
  const result = await disconnectIdentity(db, userId, provider)
  if (!result.ok) {
    if (result.reason === 'last_identity')
      throw createError({ statusCode: 422, statusMessage: 'Cannot disconnect your only sign-in method' })
    throw createError({ statusCode: 404, statusMessage: 'Identity not found' })
  }

  await useAuthHooks().callHook('user:identity-removed', { event, userId, provider })

  const wasActive = session.user.authProvider === provider
  if (wasActive)
    await clearUserSession(event)

  return { ok: true, forceLogout: wasActive }
})

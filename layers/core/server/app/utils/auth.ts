import type { H3Event } from 'h3'
import type { UserSelect } from '~~/layers/core/server/db/schema'
import { eq } from 'drizzle-orm'
import {
  createError,
} from 'h3'
import { users } from '~~/layers/core/server/db/schema'
import { resolveSessionIdentity } from '~~/shared/server/session-identity'

/**
 * The `users` row behind the request, or a 401.
 *
 * The lookup keys on the session's own user id. It used to key on
 * `session.sessionId` against the legacy `sessions` table, a column nothing has
 * written since sign-in moved to `nuxt-auth-utils`: drizzle bound `undefined`
 * and D1 rejected the statement, so every signed-in call to `/api/indexing/*`,
 * `/api/gscdump/*` and `/auth/google-indexing` returned 500.
 */
export async function authenticateUser(event: H3Event): Promise<UserSelect> {
  const identity = resolveSessionIdentity(await getUserSession(event))
  if (identity._tag === 'SignedOut') {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const user = await useDrizzle(event).query.users.findFirst({
    where: eq(users.userId, identity.userId),
  })

  if (!user) {
    // The row is gone, so the cookie names a user that no longer exists.
    await clearUserSession(event)
    throw createError({
      statusCode: 401,
      message: 'User not found',
    })
  }

  return user
}

export interface GoogleOAuthUser {
  sub: string
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
  email_verified: boolean
  locale: string
}

import type { H3Event } from 'h3'
import type { UserSession } from '~~/layers/core/app/types'
import type { UserSelect } from '~~/layers/core/server/db/schema'
import { defu } from 'defu'
import { eq } from 'drizzle-orm'
import {
  createError,
} from 'h3'
import { sessions } from '~~/layers/core/server/db/schema'

export async function authenticateUser(event: H3Event): Promise<UserSelect> {
  const session = (await getUserSession(event)) as unknown as UserSession
  if (!session?.user) {
    // unauthorized
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }

  const db = useDrizzle()
  // session can be deleted externally and user will need to re-auth
  const dbSession = await db.query.sessions.findFirst({
    where: eq(sessions.sessionId, session.sessionId),
    with: {
      user: {
        with: {
          team: true,
          googleAccounts: true,
        },
      },
    },
  })

  if (!dbSession || !dbSession.user) {
    // need to clear session
    await clearUserSession(event)
    // unauthorized
    throw createError({
      statusCode: 401,
      message: 'User not found',
    })
  }
  // resync session data
  // await setUserSession(event, user.getAttributes())
  return defu(dbSession.user, (await getUserSession(event)).user, {
    analyticsPeriod: '30d',
  }) as UserSelect
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

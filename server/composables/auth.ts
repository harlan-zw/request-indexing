import type { H3Error, H3Event } from 'h3'
import { hash } from 'ohash'
import type { TokenPayload, UserSession } from '~/types'
import { getUserToken } from '~/server/utils/storage'

export function getHashSecure(input: any) {
  const appKey = useRuntimeConfig().key
  // make an object
  return hash({ input, appKey })
}

export async function getAuthenticatedData(event: H3Event): Promise<H3Error | ({ session: UserSession, user: UserSession['user'], sub: string, tokens: TokenPayload['tokens'] })> {
  const session = (await getUserSession(event)) as UserSession
  if (!session?.user) {
    // unauthorized
    return createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }
  const token = await getUserToken(session.user.userId, 'login')
  if (!token) {
    // unauthorized
    return createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }
  return {
    sub: token.sub,
    tokens: token.tokens,
    user: session.user,
    session,
  }
}

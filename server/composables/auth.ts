import type { H3Error, H3Event } from 'h3'
import { hash } from 'ohash'
import type { TokenPayload, UserSession } from '~/types'

export function useHashSecure(input: any) {
  const appKey = useRuntimeConfig().app.key
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
  const storage = await userAppStorage<TokenPayload>(session.user.userId).getItem('auth-token')
  if (!storage) {
    // unauthorized
    return createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }
  return {
    sub: storage.sub,
    tokens: storage.tokens,
    user: session.user,
    session,
  }
}

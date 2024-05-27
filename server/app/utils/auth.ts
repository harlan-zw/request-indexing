import {
  createError,
  eventHandler,
  getQuery,
  getRequestURL,
  sendRedirect,
} from 'h3'
import { parsePath, withQuery } from 'ufo'
import { ofetch } from 'ofetch'
import { defu } from 'defu'
import type { OAuthGoogleConfig } from 'nuxt-auth-utils/dist/runtime/server/lib/oauth/google'
import type { H3Event } from 'h3'
import { clearUserSession, createOAuthPool, useRuntimeConfig } from '#imports'
import type { OAuthConfig } from '#auth-utils'
import type { UserSession } from '~/types'
import type { UserSelect } from '~/server/database/schema'
import { sessions } from '~/server/database/schema'

export async function authenticateAdmin(event: H3Event) {
  const user = await authenticateUser(event)
  if (user.email !== 'harlan@harlanzw.com') {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized',
    })
  }
  return user
}

export async function authenticateUser(event: H3Event): Promise<UserSelect> {
  const session = (await getUserSession(event)) as UserSession
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
  return dbSession.user
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

// clone of oauth.googleEventHandler from nuxt-auth-utils until
// https://github.com/Atinux/nuxt-auth-utils/issues/48 is fixed
export function googleAuthEventHandler({
  config,
  onSuccess,
  onError,
}: OAuthConfig<OAuthGoogleConfig & { authorizationParams: any }, GoogleOAuthUser>) {
  return eventHandler(async (event) => {
    config = defu(config, useRuntimeConfig(event).oauth?.google, {
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
    })
    const { code } = getQuery(event)
    const redirectUrl = getRequestURL(event).href
    if (!code) {
      // let's query the oauth pools
      const pool = createOAuthPool()
      const oauth = await pool.free()
      config.clientId = oauth.clientId
      config.clientSecret = oauth.clientSecret
      await setUserSession(event, {
        oauthClientId: oauth.googleOAuthClientId,
      })
      // initial request
      return sendRedirect(
        event,
        withQuery(config.authorizationURL, {
          response_type: 'code',
          client_id: config.clientId,
          redirect_uri: redirectUrl,
          scope: config.scope.join(' '),
          ...(config.authorizationParams || {}),
        }),
      )
    }

    const oauth = (await getUserSession(event)).oauthClientId
    const pool = createOAuthPool()
    const client = await pool.get(oauth)
    if (!client || !oauth) {
      const error = createError({
        statusCode: 401,
        message: 'Google login failed: OAuth client not found',
      })
      if (!onError)
        throw error
      return onError(event, error)
    }

    const body = {
      grant_type: 'authorization_code',
      redirect_uri: parsePath(redirectUrl).pathname,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      code,
    }

    const tokens = await ofetch(config.tokenURL, {
      method: 'POST',
      body,
    }).catch((error) => {
      return { error }
    })
    if (tokens.error) {
      const error = createError({
        statusCode: 401,
        message: `Google login failed: ${tokens.error?.data?.error_description || 'Unknown error'}`,
        data: tokens,
      })
      if (!onError)
        throw error
      return onError(event, error)
    }

    const user = await ofetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    )
    return onSuccess(event, {
      tokens,
      user,
      client,
    })
  })
}

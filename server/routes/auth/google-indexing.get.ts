import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestURL,
  sendRedirect,
} from 'h3'
import { parsePath, withQuery } from 'ufo'
import { ofetch } from 'ofetch'
import { hash } from 'ohash'
import { oauthPool } from '~/server/utils/oauthPool'
import { updateUser, userAppStorage } from '~/server/utils/storage'
import { setUserSession } from '#imports'
import { getAuthenticatedData } from '~/server/composables/auth'
import type { OAuthPoolToken } from '~/types'

// this is a copy of the googleEventHandler from nuxt-auth-utils
// we need to provide runtime config for the client id and client secret
export default defineEventHandler(async (event) => {
  const authData = await getAuthenticatedData(event)
  if (isError(authData))
    return sendError(event, authData)

  const { sub, user, session } = authData
  const pool = oauthPool()
  let token: OAuthPoolToken | undefined
  if (!user.indexingOAuthId && !user.lastIndexingOAuthId) {
    // generate one
    token = await pool.free()
  }
  else {
    token = await pool.get(user.indexingOAuthId || user.lastIndexingOAuthId!)
  }
  if (!token) {
    if (!import.meta.dev) {
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to find OAuth in pool.',
      }))
    }
    // fallback to main tokens
    token = {
      id: 'primary',
      client_id: import.meta.env.GOOGLE_INDEXING_CLIENT_ID!,
      client_secret: import.meta.env.GOOGLE_INDEXING_CLIENT_SECRET!,
      users: [],
    }
  }
  const config = {
    clientId: token!.client_id,
    clientSecret: token!.client_secret,
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    scope: [
      'https://www.googleapis.com/auth/indexing',
    ],
  }

  const query = getQuery(event)
  const { code, state } = query

  const redirectUrl = getRequestURL(event).href
  if (!code) {
    // get the referrer
    const referrer = getHeader(event, 'referer')
    const data = {
      user: { indexingOAuthId: token!.id },
      googleIndexingAuth: { referrer, state: hash(new Date()) },
    }
    await setUserSession(event, data)

    config.scope = config.scope || ['email', 'profile']
    return sendRedirect(
      event,
      withQuery(config.authorizationURL, {
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: redirectUrl,
        scope: config.scope.join(' '),
        state: data.googleIndexingAuth.state,
        login_hint: sub,
        access_type: 'offline',
        prompt: 'consent',
      }),
    )
  }
  const authPayload = session.googleIndexingAuth! || {}
  // cross-site request forgery protection
  if (authPayload.state !== state || !token) {
    return sendError(event, createError({
      statusCode: 401,
      message: 'Invalid state',
    }))
  }
  const body = {
    grant_type: 'authorization_code',
    redirect_uri: parsePath(redirectUrl).pathname,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
  }
  const tokens = await ofetch(config.tokenURL, {
    method: 'POST',
    body,
  }).catch((error) => {
    return { error }
  })
  if (tokens.error) {
    return sendError(event, createError({
      statusCode: 401,
      message: `Google login failed: ${tokens.error?.data?.error_description || 'Unknown error'}`,
      data: tokens,
    }))
  }

  // user has claimed spot in pool
  await pool.claim(token.id, user.userId)
  // save the accessToken to the user (server only)

  // will need to use storage
  const appStorage = userAppStorage(user.userId)
  await appStorage.setItem('indexing-tokens', tokens)
  await updateUser(user.userId, { indexingOAuthId: token!.id })

  await setUserSession(event, { indexingOAuthId: token!.id })

  return sendRedirect(event, authPayload.referrer || '/dashboard')
})

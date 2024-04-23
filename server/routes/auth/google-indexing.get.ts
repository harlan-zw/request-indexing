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
import { createOAuthPool } from '~/server/utils/oauthPool'
import { updateUser, updateUserToken } from '~/server/utils/storage'
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
  const pool = createOAuthPool()
  let tokenId = session.googleIndexingAuth?.indexingOAuthIdNext || user.indexingOAuthIdNext || user.lastIndexingOAuthIdNext
  let token: OAuthPoolToken | undefined
  if (!tokenId) {
    // generate one
    token = await pool.free()
    tokenId = token?.id
  }
  else {
    token = pool.get(tokenId)
    if (!token) {
      // claim a free one (pro user fallback)
      token = await pool.free()
      tokenId = token?.id
    }
  }
  if (!token || !tokenId) {
    // sent rate limted, too many users
    return sendError(event, createError({
      statusCode: 429,
      statusMessage: 'Oops, looks like we have too many users right now. Please try again later.',
    }))
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
      googleIndexingAuth: { indexingOAuthIdNext: tokenId, referrer, state: hash(new Date()) },
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
  if (authPayload.state !== state) {
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
  await pool.claim(tokenId, user.userId)
  // save the accessToken to the user (server only)

  // delete tokens
  await updateUserToken(user.userId, 'indexing', tokens)
  await updateUser(user.userId, { indexingOAuthIdNext: tokenId })
  await setUserSession(event, { user: { indexingOAuthIdNext: tokenId } })

  await incrementMetric('googleIndexingAuth')

  return sendRedirect(event, authPayload.referrer || '/dashboard')
})

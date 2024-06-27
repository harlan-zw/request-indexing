import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestURL,
  sendRedirect,
} from 'h3'
import { parsePath, withQuery } from 'ufo'
import { ofetch } from 'ofetch'

// this is a copy of the googleEventHandler from nuxt-auth-utils
// we need to provide runtime config for the client id and client secret
export default defineEventHandler(async (event) => {
  // const authData = await getAuthenticatedData(event)
  // if (isError(authData))
  //   return sendError(event, authData)
  const { adsClientId: clientId, adsClientSecret: clientSecret } = useRuntimeConfig(event).google

  const config = {
    clientId,
    clientSecret,
    authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenURL: 'https://oauth2.googleapis.com/token',
    scope: [
      'https://www.googleapis.com/auth/adwords',
    ],
  }

  const query = getQuery(event)
  const { code } = query

  const redirectUrl = getRequestURL(event).href
  if (!code) {
    config.scope = config.scope || ['email', 'profile']
    return sendRedirect(
      event,
      withQuery(config.authorizationURL, {
        response_type: 'code',
        client_id: config.clientId,
        redirect_uri: redirectUrl,
        scope: config.scope.join(' '),
        access_type: 'offline',
        prompt: 'consent',
      }),
    )
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

  return tokens
})

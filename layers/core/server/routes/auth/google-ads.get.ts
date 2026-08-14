import {
  createError,
  defineEventHandler,
  getQuery,
  getRequestURL,
  sendRedirect,
} from 'h3'
import { ofetch } from 'ofetch'
import { withQuery } from 'ufo'

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

  // Google requires the token exchange to echo the exact `redirect_uri` sent on
  // the authorize leg. Two things broke that: the callback leg carries `?code=`
  // in `getRequestURL().href`, and the exchange below sent only the pathname.
  // Strip the query so both legs use the same absolute URL, matching
  // `google-indexing.get.ts`.
  const requestUrl = getRequestURL(event)
  requestUrl.search = ''
  const redirectUrl = requestUrl.href
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
    redirect_uri: redirectUrl,
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
    throw createError({
      statusCode: 401,
      message: `Google login failed: ${tokens.error?.data?.error_description || 'Unknown error'}`,
      data: tokens,
    })
  }

  return tokens
})

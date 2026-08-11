import { GSC_INDEXING_SCOPE, GSC_READ_SCOPE, GSC_WRITE_SCOPE } from 'gscdump'
import { withQuery } from 'ufo'
import { randomUUID } from 'uncrypto'

// GSC OAuth — INTEGRATION grant, not sign-in identity. Issues Google's
// webmasters / indexing scopes with offline access + refresh tokens. The
// sign-in identity flow at /auth/google is intentionally separate (see
// google-signin-plan.md Round 6 — identity vs integration).
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const { scope: requestedScope = 'full', returnTo } = getQuery(event)

  const scopes = ['email']
  if (requestedScope === 'full') {
    scopes.push(
      GSC_WRITE_SCOPE,
      GSC_INDEXING_SCOPE,
    )
  }
  else if (requestedScope === 'write') {
    scopes.push(GSC_WRITE_SCOPE)
  }
  else if (requestedScope === 'read') {
    scopes.push(GSC_READ_SCOPE)
  }

  const state = randomUUID()
  await setUserSession(event, {
    googleOauthState: state,
    googleOauthReturnTo: typeof returnTo === 'string' ? returnTo : undefined,
  })

  const config = useRuntimeConfig(event)
  const host = getRequestHeader(event, 'host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const redirectUri = `${protocol}://${host}/auth/integrations/gsc/callback`

  return sendRedirect(
    event,
    withQuery('https://accounts.google.com/o/oauth2/v2/auth', {
      client_id: config.oauth.google.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    }),
  )
})

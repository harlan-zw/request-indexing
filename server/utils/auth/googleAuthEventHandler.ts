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
import { useRuntimeConfig } from '#imports'
import type { OAuthConfig } from '#auth-utils'

// clone of oauth.googleEventHandler from nuxt-auth-utils until
// https://github.com/Atinux/nuxt-auth-utils/issues/48 is fixed
export function googleAuthEventHandler({
  config,
  onSuccess,
  onError,
}: OAuthConfig<OAuthGoogleConfig & { authorizationParams: any }>) {
  return eventHandler(async (event) => {
    config = defu(config, useRuntimeConfig(event).oauth?.google, {
      authorizationURL: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenURL: 'https://oauth2.googleapis.com/token',
    })
    const { code } = getQuery(event)
    if (!config.clientId) {
      const error = createError({
        statusCode: 500,
        message: 'Missing NUXT_OAUTH_GOOGLE_CLIENT_ID env variables.',
      })
      if (!onError)
        throw error
      return onError(event, error)
    }
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
          ...(config.authorizationParams || {}),
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
    })
  })
}

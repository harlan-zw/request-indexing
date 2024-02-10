import { defu } from 'defu'
import { getUser, userAppStorage } from '~/server/utils/storage'
import { googleAuthEventHandler } from '~/server/utils/googleAuthEventHandler'
import { useUserIndexingApiQuota } from '~/server/utils/apiQuotaDb'
import { useHashSecure } from '~/server/composables/auth'
import type { TokenPayload, UserSession } from '~/types'

export default googleAuthEventHandler({
  config: {
    redirectUrl: '/auth/google',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
    authorizationParams: {
      prompt: 'consent',
      access_type: 'offline',
    },
  },
  async onSuccess(event, { user: _user, tokens }) {
    const user = _user as { sub: string, picture: string }
    // sub is an openid claim that is unique to the user, we don't want to expose this to the client
    const userId = `user-${useHashSecure(user.sub)}`
    const quota = await useUserIndexingApiQuota(userId)
    const userPublicPersistentData = await getUser(userId)

    await setUserSession(event, {
      // public data only!
      user: {
        userId,
        picture: user.picture,
        indexingApiQuota: quota.value,
        analyticsPeriod: '28d',
        ...userPublicPersistentData, // contains analyticsPeriod if changed
      } satisfies UserSession['user'],
    })
    const tokenStorage = userAppStorage<TokenPayload>(userId)
    const { tokens: currentTokens } = (await tokenStorage.getItem('auth-token')) || {}
    // store tokens based on user id
    await tokenStorage.setItem('auth-token', {
      updatedAt: Date.now(),
      sub: user.sub,
      tokens: defu(tokens, currentTokens), // avoid refresh token getting deleted
    })
    return sendRedirect(event, '/dashboard')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})

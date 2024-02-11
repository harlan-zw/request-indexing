import { defu } from 'defu'
import { getUser, getUserToken, incrementMetric, updateUserToken } from '~/server/utils/storage'
import { googleAuthEventHandler } from '~/server/utils/auth/googleAuthEventHandler'
import { getHashSecure } from '~/server/composables/auth'
import type { UserSession } from '~/types'
import { getUserQuota } from '~/server/utils/quota'

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
    const user = _user as { sub: string, picture: string, email: string }
    // sub is an openid claim that is unique to the user, we don't want to expose this to the client
    const userId = `user-${getHashSecure(user.sub)}`
    if (!(await getUser(userId))) {
      // TODO handle sign up login (emails, etc)
      await incrementMetric('signups')
    }
    const quota = await getUserQuota(userId)
    await updateUser(userId, {
      email: user.email,
    })
    const userPublicPersistentData = await getUser(userId)

    await setUserSession(event, {
      // public data only!
      user: {
        email: user.email,
        quota,
        userId,
        picture: user.picture,
        analyticsPeriod: '28d',
        ...userPublicPersistentData, // contains analyticsPeriod if changed
      } satisfies UserSession['user'],
    })
    const { tokens: currentTokens } = await getUserToken(userId, 'login') || {}
    await updateUserToken(userId, 'login', {
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

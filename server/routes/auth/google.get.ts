import { googleAuthEventHandler } from '~/server/app/utils/auth'
import type { UserSession } from '~/types'
import { useMessageQueue } from '~/lib/nuxt-ttyl/runtime/nitro/mq'
import { createGoogleOAuthClient } from '~/server/app/services/gsc'
import { User } from '~/server/app/models/User'

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
  async onSuccess(event, { user: _oauthUserData, tokens }) {
    // use the google services to see what scopes the user has
    const client = createGoogleOAuthClient(tokens)
    const tokenInfo = await client.getTokenInfo(tokens.access_token)
    if (!tokenInfo.scopes.includes('https://www.googleapis.com/auth/webmasters.readonly')) {
      await setUserSession(event, {
        authError: 'missing-scope',
      })
      return sendRedirect(event, '/get-started?error=missing-scope')
    }

    const oauthUserData = _oauthUserData as { sub: string, picture: string, email: string }
    // sub is an openid claim that is unique to the user, we don't want to expose this to the client
    const userId = `user-${getHashSecure(oauthUserData.sub)}`

    const userExists = await User.exists(userId)

    const user = await (userExists
      ? User.findOrFail(userId)
      : User.create({
        ...oauthUserData,
        userId,
      }))
    if (!userExists)
      !import.meta.dev && await useMessageQueue().message('/services/_mq/signUp', { user: { userId, email: user.email } })

    user.lastLogin = Date.now()
    user.loginTokens = tokens
    await user.save()
    console.log(user)

    const quota = await user.quota()
    // await updateUser(userId, payload)
    // const userPublicPersistentData = await getUser(userId)

    await setUserSession(event, {
      // public data only!
      user: {
        email: user.email,
        quota,
        userId,
        picture: user.picture,
        analyticsPeriod: '30d',
        // ...userPublicPersistentData, // contains analyticsPeriod if changed
      } satisfies UserSession['user'],
    })

    if (user.onboardedStep !== 'sites-and-backup') {
      await useMessageQueue().message('/api/_mq/ingest/sites', { user: { userId, email: user.email } })
      return sendRedirect(event, '/dashboard/welcome')
    }
    return sendRedirect(event, '/dashboard')
  },
  // Optional, will return a json error and 401 status code by default
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/')
  },
})

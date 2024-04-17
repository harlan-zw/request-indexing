import { OAuth2Client } from 'googleapis-common'
import { useAuthenticatedUser } from '~/server/app/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await useAuthenticatedUser(event)
  const tokens = user.loginTokens

  if (user.indexingOAuthId) {
    // need to claim back the token from the pool
    const pool = createOAuthPool()
    const oAuth = pool.get(user.indexingOAuthId!)
    if (oAuth)
      await pool.release(oAuth.id, user.userId)
  }

  await incrementMetric('deletedUsers')

  await clearUserStorage(user.userId)

  // // clear user session
  await clearUserSession(event)

  // revoke the token with google
  const oauth2Client = new OAuth2Client()
  oauth2Client.setCredentials(tokens!)
  return oauth2Client.revokeToken(tokens!.refresh_token || tokens.access_token!)
    .then(res => res.data)
})

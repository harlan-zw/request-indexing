import { OAuth2Client } from 'googleapis-common'
import { setUserSession } from '#imports'
import { deleteUserToken, getUserToken } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData

  if (!user.indexingOAuthId!) {
    return createError({
      statusCode: 400,
      message: 'No indexing OAuth found.',
    })
  }
  // need to claim back the token from the pool
  const pool = createOAuthPool()
  const oAuth = pool.get(user.indexingOAuthId)
  if (oAuth)
    await pool.release(oAuth.id, user.userId)

  // keep a reference of the last indexingOAuthId
  await setUserSession(event, {
    user: {
      indexingOAuthId: '',
      lastIndexingOAuthId: user.indexingOAuthId,
    },
  })

  // delete tokens
  const tokens = await getUserToken(user.userId, 'indexing')
  await deleteUserToken(user.userId, 'indexing')

  if (!tokens) {
    // already deleted
    return { status: 'ok' }
  }

  // revoke the token with google
  const oauth2Client = new OAuth2Client()
  oauth2Client.setCredentials(tokens!)
  return oauth2Client.revokeToken(tokens!.refresh_token || tokens.access_token!)
    .then(res => res.data)
})

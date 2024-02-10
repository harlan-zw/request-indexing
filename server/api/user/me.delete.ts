export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData

  if (user.indexingOAuthId) {
    // need to claim back the token from the pool
    const pool = oauthPool()
    const oAuth = await pool.get(user.indexingOAuthId!)
    if (oAuth)
      await pool.release(oAuth.id, user.userId)
  }

  // clear not working for some reason
  const keys = await userAppStorage(user.userId).getKeys()
  for (const key of keys)
    await userAppStorage(user.userId).removeItem(key)

  // // clear user session
  await clearUserSession(event)

  // should be good to go
  return 'ok'
})

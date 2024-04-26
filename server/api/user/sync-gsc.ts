import { useAuthenticatedUser } from '~/server/app/utils/auth'
import { queueJob } from '~/server/plugins/eventServiceProvider'

export default defineEventHandler(async (event) => {
  const user = await useAuthenticatedUser(event)

  await queueJob('users/syncGoogleSearchConsoleSites', user)
  return 'OK'
})

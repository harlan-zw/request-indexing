import { authenticateUser } from '~/server/app/utils/auth'
import { queueJob } from '~/server/plugins/eventServiceProvider'

export default defineEventHandler(async (event) => {
  const user = await authenticateUser(event)

  await queueJob('users/syncGscSites', user)
  return 'OK'
})

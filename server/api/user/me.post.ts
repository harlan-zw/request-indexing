import type { User } from '~/types'
import { updateUser } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const { user } = event.context.authenticatedData

  const { analyticsPeriod, hiddenSites } = await readBody<Partial<User>>(event)

  const session = await setUserSession(event, { user: { analyticsPeriod, hiddenSites } })
  await updateUser(user.userId, { analyticsPeriod, hiddenSites })
  return session
})

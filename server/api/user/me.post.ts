import type { User } from '~/types'
import { updateUser, userMerger } from '~/server/utils/storage'
import { mergeUserSessionData } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  const { user: _user } = event.context.authenticatedData

  const { analyticsPeriod, hiddenSites } = await readBody<Partial<User>>(event)

  await incrementMetric('updatedDetails')

  const user = await updateUser(_user.userId, { analyticsPeriod, hiddenSites })
  return await mergeUserSessionData(event, { user }, userMerger)
})

import { authenticateUser } from '~/server/app/utils/auth'
import type { UserSelect } from '~/server/database/schema'
import { users } from '~/server/database/schema'

export default defineEventHandler(async (e) => {
  // TODO re-implement
  const user = await authenticateUser(e)

  const { analyticsRange, analyticsPeriod } = await readBody<Partial<UserSelect>>(e)

  const _user = (await useDrizzle().update(users).set({
    analyticsRange,
    analyticsPeriod,
  }).where(eq(users.userId, user.userId))
    .returning())[0]

  console.log('savesd user', _user)

  await setUserSession(e, {
    user: {
      analyticsPeriod: _user.analyticsPeriod,
      analyticsRange: _user.analyticsRange,
    },
  })
  console.log('set session', {
    user: {
      analyticsPeriod: _user.analyticsPeriod,
      analyticsRange: _user.analyticsRange,
    },
  })
  return user

  // const hasSelectedSites = selectedSites && selectedSites.length > 0
  // if (hasSelectedSites && selectedSites.length > 6) {
  //   return sendError(event, createError({
  //     statusCode: 422,
  //     message: 'Too many sites selected',
  //   }))
  // }

  // sync any new sites we may be adding
  // const addingSitesDiff = hasSelectedSites ? selectedSites.filter(site => !(_user.selectedSites || []).includes(site)) : []
  // if (addingSitesDiff.length) {
  //   // sync the selected sites
  //   // await Promise.all(addingSitesDiff.map(async (site) => {
  //   //   await mq.message(`/api/_mq/ingest/site/dates`, { userId: _user.userId, site })
  //   // }))
  // }

  // // await incrementMetric('updatedDetails')
  // useDrizzle().update(users).set({
  //   selectedSites,
  //   backupsEnabled,
  //   analyticsPeriod,
  //   onboardedStep,
  //   analyticsRange,
  // }).where(eq(users.userId, _user.userId))

  // const user = await updateUser(_user.userId, {
  //   selectedSites,
  //   backupsEnabled,
  //   analyticsPeriod,
  //   onboardedStep,
  //   analyticsRange,
  // })
  // return await mergeUserSessionData(event, { user }, userMerger)
})

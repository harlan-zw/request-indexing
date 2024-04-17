export default defineEventHandler(async () => {
  // TODO re-implement
  // const _user = await useAuthenticatedUser(event)

  // const { onboardedStep, analyticsRange, analyticsPeriod, selectedSites, backupsEnabled } = await readBody<Partial<UserSelect>>(event)
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

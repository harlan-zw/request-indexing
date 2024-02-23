import type { User } from '~/types'
import { mergeUserSessionData } from '~/server/app/services/session'

export default defineEventHandler(async (event) => {
  const { user: _user } = event.context.authenticatedData

  const { onboardedStep, analyticsRange, analyticsPeriod, selectedSites, backupsEnabled } = await readBody<Partial<User>>(event)

  const hasSelectedSites = selectedSites && selectedSites.length > 0
  if (hasSelectedSites && selectedSites.length > 20) {
    return sendError(event, createError({
      statusCode: 422,
      message: 'Too many sites selected',
    }))
  }

  // sync any new sites we may be adding
  const addingSitesDiff = hasSelectedSites ? selectedSites.filter(site => !(_user.selectedSites || []).includes(site)) : []
  if (addingSitesDiff.length) {
    // sync the selected sites
    await Promise.all(addingSitesDiff.map(async (site) => {
      await mq.message(`/api/_mq/ingest/site/dates`, { user: { userId: _user.userId }, site })
    }))
  }

  await incrementMetric('updatedDetails')

  const user = await updateUser(_user.userId, {
    selectedSites,
    backupsEnabled,
    analyticsPeriod,
    onboardedStep,
    analyticsRange,
  })
  return await mergeUserSessionData(event, { user }, userMerger)
})

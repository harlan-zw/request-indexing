import { inArray } from 'drizzle-orm'
import { useAuthenticatedUser } from '~/server/app/utils/auth'
import type { TeamSelect } from '~/server/database/schema'
import { teamSites, teams } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const _user = await useAuthenticatedUser(event)

  const { onboardedStep, backupsEnabled, selectedSites } = await readBody<Partial<TeamSelect> & { selectedSites: number[] }>(event)
  const hasSelectedSites = selectedSites && selectedSites.length > 0
  if (hasSelectedSites && selectedSites.length > 6) {
    return sendError(event, createError({
      statusCode: 422,
      message: 'Too many sites selected',
    }))
  }
  const db = useDrizzle()
  await Promise.all([
    // update team
    db.update(teams).set({
      backupsEnabled,
      onboardedStep,
    }).where(eq(teams.teamId, _user.currentTeamId)),

    // disable all
    db.update(teamSites).set({
      visible: false,
    }).where(eq(teamSites.teamId, _user.currentTeamId)),

    // enable selected
    db.update(teamSites).set({
      visible: true,
    }).where(and(inArray(teamSites.siteId, selectedSites), eq(teamSites.teamId, _user.currentTeamId))),
  ])

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

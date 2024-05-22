import { inArray } from 'drizzle-orm'
import { authenticateUser } from '~/server/app/utils/auth'
import type { TeamSelect } from '~/server/database/schema'
import { sites, teamSites, teams } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const _user = await authenticateUser(event)

  const { onboardedStep, backupsEnabled, selectedSites } = await readBody<Partial<TeamSelect> & { selectedSites: string[] }>(event)
  const hasSelectedSites = selectedSites && selectedSites.length > 0
  if (hasSelectedSites && selectedSites.length > 6) {
    return sendError(event, createError({
      statusCode: 422,
      message: 'Too many sites selected',
    }))
  }
  const db = useDrizzle()
  const realSiteIds = await db.select({ siteId: sites.siteId })
    .from(sites)
    .where(inArray(sites.publicId, selectedSites))
  const [team] = await Promise.all([
    // update team
    db.update(teams).set({
      backupsEnabled,
      onboardedStep,
    }).where(eq(teams.teamId, _user.currentTeamId))
      .returning(),

    db.delete(teamSites).where(eq(teamSites.teamId, _user.currentTeamId)),

    // enable selected
    db.insert(teamSites).values(realSiteIds.map(site => ({
      teamId: _user.currentTeamId,
      ...site,
      googleAccountId: _user.googleAccounts[0].googleAccountId,
    }))),
  ])

  // need to sync session
  await setUserSession(event, {
    team: {
      onboardedStep,
    },
  })

  const nitroApp = useNitroApp()
  await nitroApp.hooks.callHook('app:team:sites-selected', team[0])

  return 'OK'

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

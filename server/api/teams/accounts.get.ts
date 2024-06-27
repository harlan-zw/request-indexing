import { authenticateUser } from '~/server/app/utils/auth'
import { teamUser } from '~/server/database/schema'

export default defineEventHandler(async (event) => {
  const _user = await authenticateUser(event)

  const db = useDrizzle()
  return await db.query.teamUser.findMany({
    where: eq(teamUser.teamId, _user.team.teamId),
    with: {
      user: {
        // only the name, public id, email and avatar
        columns: {
          name: true,
          publicId: true,
          email: true,
          avatar: true,
        },
      },
    },
  })
  // const [team] = await Promise.all([
  //   // update team
  //   db.update(teams).set({
  //     backupsEnabled,
  //     onboardedStep,
  //   }).where(eq(teams.teamId, _user.currentTeamId))
  //     .returning(),
  //
  //   db.delete(teamSites).where(eq(teamSites.teamId, _user.currentTeamId)),
  //
  //   // enable selected
  //   db.insert(teamSites).values(selectedSites.map(siteId => ({
  //     teamId: _user.currentTeamId,
  //     siteId,
  //   }))),
  // ])
  //
  // const nitroApp = useNitroApp()
  // await nitroApp.hooks.callHook('app:team:sites-selected', team[0])
  //
  // return 'OK'

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

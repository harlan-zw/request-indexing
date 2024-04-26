import {
  teamSites,
} from '~/server/database/schema'
import { defineJobHandler } from '~/server/plugins/eventServiceProvider'
// import { wsUsers } from '~/server/routes/_ws'

// only after they have selected it as a site
export default defineJobHandler(async (event) => {
  const { teamId } = await readBody<{ teamId: number }>(event)

  // get all sites for this team
  const db = useDrizzle()
  const teamsSites = await db.query.sites.findMany({
    with: {
      teamSites: true,
    },
    where: eq(teamSites.teamId, teamId),
  })

  console.log(teamsSites.map(s => s.siteId))

  //
  // const site = await db.query.sites.findFirst({
  //   with: {
  //     owner: true,
  //   },
  //   where: eq(sites.siteId, siteId),
  // })
  //
  // if (!site || !site.owner) {
  //   throw createError({
  //     statusCode: 404,
  //     message: 'Site or User not found',
  //   })
  // }

  // queue top 3 pages to have their performance scanned
  // TODO only after they have selected it as a site
  // await Promise.all(
  //   urls
  //     .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
  //     .slice(0, 2)
  //     .map(row => ['mobile', 'desktop'].map((strategy) => {
  //       return mq.message('/api/_mq/cron/daily/site/psi', {
  //         siteId: site.siteId,
  //         page: row.path,
  //         strategy,
  //       })
  //     }))
  //     .flat(),
  // )

  return {
    res: 0,
  }
})

import dayjs from 'dayjs'
import { isNull, lt } from 'drizzle-orm'
import {
  sites,
  teamSites,
} from '~/server/database/schema'
import { batchJobs, defineJobHandler } from '~/server/plugins/eventServiceProvider'
// import { wsUsers } from '~/server/routes/_ws'

// only after they have selected it as a site
export default defineJobHandler(async (event) => {
  const { teamId } = await readBody<{ teamId: number }>(event)

  // get all sites for this team
  const db = useDrizzle()
  // const teamsSites = await db.query.teamSites.findMany({
  //   with: {
  //     site: true,
  //   },
  //   where: and(
  //     eq(teamSites.teamId, teamId),
  //     // lastSynced must be before today
  //     or(
  //       isNull(sites.lastSynced),
  //       lt(sites.lastSynced, dayjs().startOf('day').format('YYYY-MM-DD')),
  //     ),
  //   ),
  // })

  const teamsSites = await db.select({
    siteId: teamSites.siteId,
  })
    .from(teamSites)
    .where(and(
      eq(teamSites.teamId, teamId),
      or(
        isNull(sites.lastSynced),
        lt(sites.lastSynced, dayjs().startOf('day').toDate().getTime()),
      ),
    ))
    .leftJoin(sites, eq(teamSites.siteId, sites.siteId))

  // need last 30d to show graph and last 60 to show comparison
  const dates = Array.from({ length: 61 }, (_, i) => dayjs().subtract(i, 'day').format('YYYY-MM-DD'))

  await Promise.all(
    teamsSites.map((row) => {
      const gscJobs = dates.map((date) => {
        return ['date', 'page', 'query', 'all', 'country'].map(job => ({
          name: `gsc/${job}`,
          queue: 'gsc',
          entityId: row.siteId,
          entityType: 'site',
          payload: {
            siteId: row.siteId,
            date,
          },
        }))
      }).flat()
      const psiJobs = ['mobile', 'desktop'].map(strategy => ({
        name: 'paths/runPsi',
        queue: 'psi',
        entityId: row.siteId,
        entityType: 'site',
        payload: {
          siteId: row.siteId,
          path: '/',
          strategy,
        },
      }))
      return batchJobs({
        name: 'site/sync',
        options: {
          onFinish: {
            name: 'sites/syncFinished',
            entityId: row.siteId,
            entityType: 'site',
            payload: {
              siteId: row.siteId,
            },
          },
        },
      }, [
        {
          name: 'sites/syncSitemapPages',
          entityId: row.siteId,
          entityType: 'site',
          payload: {
            siteId: row.siteId,
          },
        },
        ...psiJobs,
        ...gscJobs,
      ])
    }),
  )

  return {
    res: 'OK',
  }
})

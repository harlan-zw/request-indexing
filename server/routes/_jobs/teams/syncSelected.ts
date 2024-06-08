import dayjs from 'dayjs'
import { defu } from 'defu'
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
      const jobOptions = {
        entityId: row.siteId,
        entityType: 'site',
        payload: {
          siteId: row.siteId,
        },
      }
      return batchJobs({
        name: 'site/sync',
        options: {
          onFinish: {
            name: 'sites/syncFinished',
            ...jobOptions,
          },
        },
      }, [
        {
          name: 'sites/syncGscDates',
          queue: 'gsc',
        },
        {
          name: 'sites/syncSitemapPages',
        },
        {
          name: 'paths/runPsi',
          queue: 'psi',
          payload: {
            path: '/',
            strategy: 'mobile',
          },
        },
        {
          name: 'paths/runPsi',
          queue: 'psi',
          payload: {
            path: '/',
            strategy: 'desktop',
          },
        },
        ...dates.map((date) => {
          return {
            name: 'sites/syncGscDate',
            queue: 'gsc',
            payload: {
              date,
            },
          }
        }),
      ]
        .map(job => defu(job, jobOptions)))
    }).flat(),
  )

  return {
    res: 'OK',
  }
})

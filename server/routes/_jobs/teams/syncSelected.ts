import dayjs from 'dayjs'
import { defu } from 'defu'
import {
  teamSites,
} from '~/server/database/schema'
import { batchJobs, defineJobHandler } from '~/server/plugins/eventServiceProvider'
// import { wsUsers } from '~/server/routes/_ws'

// only after they have selected it as a site
export default defineJobHandler(async (event) => {
  const { teamId } = await readBody<{ teamId: number }>(event)

  // get all sites for this team
  const db = useDrizzle()
  const teamsSites = await db.query.teamSites.findMany({
    with: {
      site: true,
    },
    where: eq(teamSites.teamId, teamId),
  })

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
          name: 'sites/syncGscFirstDate',
        },
        {
          name: 'sites/syncSitemapPages',
        },
        {
          name: 'paths/runPsi',
          payload: {
            path: '/',
            strategy: 'mobile',
          },
        },
        {
          name: 'paths/runPsi',
          payload: {
            path: '/',
            strategy: 'desktop',
          },
        },
        ...dates.map((date) => {
          return {
            name: 'sites/syncGscDate',
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

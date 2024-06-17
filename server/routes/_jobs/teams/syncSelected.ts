import dayjs from 'dayjs'
import { isNull, lt } from 'drizzle-orm'
import {
  sites,
  teamSites,
} from '~/server/database/schema'
import { batchJobs, defineJobHandler } from '~/server/plugins/eventServiceProvider'
import { dayjsPst } from '~/server/utils/dayjs'
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

  await Promise.all(
    teamsSites.map((row) => {
      // today PST
      const endDayjs = dayjsPst().subtract(1, 'day') // avoid partial data
      // TODO check earliest dates
      const TOTAL_PAGES = 90
      const CHUNK_SIZE = 30 // divisible by 10
      // we want to get the last 90 days, for this we'll create 9 separate jobs all doing 10 days each
      const regionChunks = Array.from({ length: TOTAL_PAGES / CHUNK_SIZE }, (_, i) => i * CHUNK_SIZE)
        .map((start) => {
          return {
            start: endDayjs.subtract(start + CHUNK_SIZE, 'day').format('YYYY-MM-DD'),
            end: endDayjs.subtract(start, 'day').format('YYYY-MM-DD'),
          }
        })
      const gscJobs = regionChunks.map(({ start, end }) => {
        return ['date', 'page', 'query', 'all', 'country', 'device'].map(job => ({
          name: `gsc/${job}`,
          queue: 'gsc',
          entityId: row.siteId,
          entityType: 'site',
          payload: {
            siteId: row.siteId,
            start,
            end,
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
        {
          name: 'crux/history',
          entityId: row.siteId,
          entityType: 'site',
          payload: {
            siteId: row.siteId,
            strategy: 'DESKTOP',
          },
        },
        {
          name: 'crux/history',
          entityId: row.siteId,
          entityType: 'site',
          payload: {
            siteId: row.siteId,
            strategy: 'PHONE',
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

import { eq } from 'drizzle-orm'
import { sites, teamSites } from '~/server/database/schema'
import { dayjs } from '~/server/utils/dayjs'
import { batchJobs } from '~/server/plugins/eventServiceProvider'

export default defineTask({
  meta: {
    name: 'sites:sync.daily',
    description: 'Syncs sites daily',
  },
  async run() {
    // find all sites which are visible and have not been updated in the last 24 hours
    const db = useDrizzle()

    // TODO we should ideally group by google account and queue them at minute increments to sync
    const validSites = await db.selectDistinct({
      siteId: teamSites.siteId,
      lastSynced: sites.lastSynced,
    }).from(teamSites)
      .where(and(
        eq(sites.active, true),
        // or(
        //   isNull(sites.lastSynced),
        //   lt(sites.lastSynced, dayjsPst().format('YYYY-MM-DD')),
        // ),
      ))
      .leftJoin(sites, eq(teamSites.siteId, sites.siteId))
      // .limit(10)
    console.log(validSites)
    console.log({
      start: '2024-06-14',
      end: dayjsPst().format('YYYY-MM-DD'),
    })

    for (const site of validSites) {
      const lastSynced = dayjs(site.lastSynced)
      const gscJobs = ['date', 'page', 'query', 'all', 'country', 'device'].map(job => ({
        name: `gsc/${job}`,
        queue: 'gsc',
        entityId: site.siteId,
        entityType: 'site',
        payload: {
          siteId: site.siteId,
          start: '2024-06-14',
          end: dayjsPst().format('YYYY-MM-DD'),
        },
      }))
      // do psi scans
      await batchJobs({
        name: 'site/sync',
        options: {
          onFinish: {
            name: 'sites/syncFinished',
            entityId: site.siteId,
            entityType: 'site',
            payload: {
              siteId: site.siteId,
            },
          },
        },
      }, [
        {
          name: 'sites/syncSitemapPages',
          entityId: site.siteId,
          entityType: 'site',
          payload: {
            siteId: site.siteId,
          },
        },
        {
          name: 'paths/runPsi',
          entityId: site.siteId,
          entityType: 'site',
          queue: 'psi',
          payload: {
            siteId: site.siteId,
            path: '/',
            strategy: 'mobile',
          },
        },
        {
          name: 'paths/runPsi',
          entityId: site.siteId,
          entityType: 'site',
          queue: 'psi',
          payload: {
            siteId: site.siteId,
            path: '/',
            strategy: 'desktop',
          },
        },
        ...gscJobs,
      ])
    }
    return { result: validSites }
  },
})

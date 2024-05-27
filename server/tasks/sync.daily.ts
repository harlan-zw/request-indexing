import { eq, isNull, lt, or } from 'drizzle-orm'
import { defu } from 'defu'
import type { JobInsert } from '~/server/database/schema'
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

    const time = dayjs().tz('America/Los_Angeles').hour(12).minute(15).second(0)

    // TODO we should ideally group by google account and queue them at minute increments to sync
    const validSites = await db.selectDistinct({
      siteId: teamSites.siteId,
      lastSynced: sites.lastSynced,
    }).from(teamSites)
      .where(and(
        eq(sites.active, true),
        or(
          isNull(sites.lastSynced),
          lt(sites.lastSynced, time.toDate().getTime()),
        ),
      ))
      .leftJoin(sites, eq(teamSites.siteId, sites.siteId))
      .limit(10)

    for (const site of validSites) {
      const lastSynced = dayjs(site.lastSynced)
      const diffDays = dayjs().diff(lastSynced, 'days')
      const jobOptions = {
        entityId: site.siteId,
        entityType: 'site',
        payload: {
          siteId: site.siteId,
        },
      }
      // do psi scans
      await batchJobs({
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
            page: '/',
            strategy: 'mobile',
          },
        },
        {
          name: 'paths/runPsi',
          payload: {
            page: '/',
            strategy: 'desktop',
          },
        },
        ...Array.from({ length: diffDays }, (_, i) => lastSynced.add(i, 'day').format('YYYY-MM-DD'))
          .map((date) => {
            return {
              name: 'sites/syncGscDate',
              payload: {
                date,
              },
            }
          }),
      ]
        .map(job => defu(job, jobOptions) as any as JobInsert))
    }
    return { result: validSites }
  },
})

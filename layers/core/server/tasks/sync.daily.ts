import { eq } from 'drizzle-orm'
import { sites, teamSites } from '~~/layers/core/server/db/schema'
import { batchJobs } from '~~/layers/core/server/utils/event-service'

export default defineTask({
  meta: {
    name: 'sites:sync.daily',
    description: 'Syncs sites daily (GSC data handled by gscdump)',
  },
  async run() {
    const db = useDrizzle()
    const env = (globalThis.__env__ ?? {}) as Record<string, unknown>

    const validSites = await db.selectDistinct({
      siteId: teamSites.siteId,
      lastSynced: sites.lastSynced,
    }).from(teamSites).where(eq(sites.active, true)).leftJoin(sites, eq(teamSites.siteId, sites.siteId))

    for (const site of validSites) {
      await batchJobs(db, env, {
        name: 'site/sync',
        siteId: site.siteId,
        onFinish: {
          name: 'sites/sync-finished',
          payload: { siteId: site.siteId },
        },
      }, [])
    }
    return { result: validSites }
  },
})

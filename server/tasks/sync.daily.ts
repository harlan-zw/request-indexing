import { eq, isNull, lt, or } from 'drizzle-orm'
import { sites, teamSites } from '~/server/database/schema'

export default defineTask({
  meta: {
    name: 'sites:sync.daily',
    description: 'Syncs sites daily',
  },
  run({ payload, context }) {
    // find all sites which are visible and have not been updated in the last 24 hours
    const db = useDrizzle()
    const validSites = db.query.sites.findMany({
      with: {
        teamSites: {
          where: eq(teamSites.visible, true),
        },
      },
      where: and(
        eq(sites.active, true),
        or(
          isNull(sites.lastSynced),
          lt(sites.lastSynced, Date.now() - 24 * 60 * 60 * 1000),
        ),
        // ensure teamSites is set
        eq(teamSites.siteId, sites.siteId),
      ),
    })
    return { result: payload }
  },
})

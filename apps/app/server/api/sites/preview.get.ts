// Onboarding site picker (`dashboard/team/setup.vue`, `dashboard/team/sites.vue`).
// Runs before a team has any `team_sites` rows, so this lists the caller's own
// synced GSC properties (`sites.ownerId`), not a team-scoped join — matching
// the owner-scoped pattern already used by `gsc-properties.get.ts` for the
// same reason ("team→site lives on team_sites, list owner-scoped until
// selection happens"). Sync status/progress comes from gscdump's lifecycle;
// `pageCount30Day` is a real per-site page count pulled from gscdump `getData`
// (not fabricated), bounded to synced sites only.
import { and, eq } from 'drizzle-orm'
import { between, date, daysAgo, gsc, page, today } from 'gscdump/query'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { sites, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { isNearRetentionLimit, lifecycleSiteFor, syncStatusFor } from '../../utils/site-lifecycle'

import { MAX_TEAM_SITES } from '../../utils/team-site-limit'

// Real per-site page count over the trailing 30 days (`limit(1)`: we only
// need `totalCount` from the response, not the rows themselves).
const pageCountState = gsc.select(page).where(between(date, daysAgo(30), today())).limit(1).getState()

export default defineProApiHandler({}, async ({ db, caller }) => {
  const ownedSites = await db.select().from(sites).where(and(eq(sites.ownerId, caller.user.id), eq(sites.active, true))).all()

  const [user] = await db.select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, caller.user.id))

  const gscdump = useGscdumpClient()
  const lifecycle = user?.gscdumpUserId
    ? await gscdump.getUserLifecycle(user.gscdumpUserId).catch(() => null)
    : null

  const previews = await Promise.all(ownedSites.map(async (site) => {
    const lifecycleSite = lifecycleSiteFor(lifecycle, site.gscdumpSiteId)
    const syncStatus = syncStatusFor(lifecycleSite, site.gscdumpSyncStatus)
    const oldest = lifecycleSite?.analytics.syncedRange.oldest ?? null

    const pageCount30Day = (site.gscdumpSiteId && lifecycleSite?.analytics.queryable)
      ? await gscdump.getData(site.gscdumpSiteId, pageCountState).then(r => r.totalCount).catch(() => 0)
      : 0

    return {
      site,
      syncStatus,
      preview: {
        sitemaps: site.sitemaps ?? [],
        siteId: site.publicId,
        domain: site.domain,
        // `sites.domain` is null on rows imported from the old KV store. The
        // Search Console property is the only label those rows carry, so it
        // ships with the preview and `siteLabel()` falls back to it.
        property: site.property,
        pageCount30Day,
        startOfData: oldest,
        isLosingData: isNearRetentionLimit(oldest),
      },
    }
  }))

  const stillSyncing = previews.some(p => p.syncStatus === 'pending' || p.syncStatus === 'syncing')

  return {
    sites: previews.map(p => p.preview),
    jobStatus: !lifecycle ? 'pending' : (stillSyncing ? 'pending' : 'ready'),
    maxSites: MAX_TEAM_SITES,
  }
})

// Team-scoped site roster consumed by `fetchSites()`
// (layers/core/app/composables/fetch.ts), which every dashboard page reads
// through.
//
// Scoped by `sites.team_id`, the ownership axis migration 0014 made NOT NULL.
// This used to inner join `team_sites`, whose rows carry a Google account and
// are written only by the Search Console link path, so a site connected by
// address during onboarding was missing from the sidebar and from every page
// that reads this roster: onboarding finished and the dashboard said "No sites
// yet". `/api/sites/preview` already scopes the same roster this way.
import type { SiteFleetRow } from '~~/layers/core/app/types'
import { and, eq } from 'drizzle-orm'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { sites, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { lifecycleSiteFor, syncStatusFor } from '../../utils/site-lifecycle'

export default defineProApiHandler({ team: true }, async ({ team: ctx }) => {
  const rows = await ctx.db.select({ site: sites })
    .from(sites)
    .where(and(eq(sites.teamId, ctx.team.teamId), eq(sites.active, true)))
    .all()

  // V1: sync status is read against the caller's own gscdump user, not the
  // team's. Teammates who didn't add a given site see a stale (DB-cached)
  // status for it until they're attributed their own gscdump identity.
  const [user] = await ctx.db.select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, ctx.caller.user.id))

  const lifecycle = user?.gscdumpUserId
    ? await useGscdumpClient().getUserLifecycle(user.gscdumpUserId).catch(() => null)
    : null

  return {
    sites: rows.map(({ site }): SiteFleetRow => {
      const lifecycleSite = lifecycleSiteFor(lifecycle, site.gscdumpSiteId)
      return {
        siteId: site.publicId,
        domain: site.domain,
        property: site.property,
        sitemaps: site.sitemaps ?? [],
        gscdumpSiteId: site.gscdumpSiteId,
        syncStatus: syncStatusFor(lifecycleSite, site.gscdumpSyncStatus),
        lastSynced: site.lastSynced,
      }
    }),
  }
})

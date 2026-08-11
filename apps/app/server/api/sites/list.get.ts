// Team-scoped site roster consumed by `fetchSites()`
// (layers/core/app/composables/fetch.ts), which every dashboard page reads
// through. `team_sites` predates the pro-saas augment and isn't re-exported
// by the `#schema` surface, so it's imported straight from the core schema
// (matches `apps/app/server/api/teams/sites.get.ts`).
import { and, eq } from 'drizzle-orm'
import { teamSites } from '~~/layers/core/server/db/schema'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { sites, users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { lifecycleSiteFor, syncStatusFor } from '../../utils/site-lifecycle'

export default defineProApiHandler({ team: true }, async ({ team: ctx }) => {
  const rows = await ctx.db.select({ site: sites })
    .from(sites)
    .innerJoin(teamSites, and(eq(sites.siteId, teamSites.siteId), eq(teamSites.teamId, ctx.team.teamId)))
    .where(eq(sites.active, true))
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
    sites: rows.map(({ site }) => {
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

// Site removal. Ownership-checked via `requireTeamSite` (caller's current
// team must have `manage-sites` and the site must be linked into that team's
// `team_sites`). Fires `pro:site:removed` before the row purge so
// `site-removed-unlink.ts` can still read `gscdumpSiteId` and call
// `useGscdumpClient().deleteSite()` itself — this route does not call the
// gscdump client directly, it just triggers the existing listener.
//
// D1 doesn't enforce FK cascades (see `delete-user.ts`), so every table that
// references `sites.siteId` is purged explicitly, children before the
// `sites` row itself. `jobs`/`failed_jobs`/`job_batches` carry a bare
// (non-FK) `site_id` column for queue bookkeeping and are intentionally left
// alone — they're transient queue history, not site data.
import { eq } from 'drizzle-orm'
import {
  indexingInvestigations,
  indexingJobs,
  relatedKeywords,
  siteDateAnalytics,
  siteDateCountryAnalytics,
  siteKeywordDateAnalytics,
  siteKeywordDatePathAnalytics,
  sitePathDateAnalytics,
  sitePaths,
  teamSites,
  usages,
  userSites,
} from '~~/layers/core/server/db/schema'
import { dispatchEvent } from '#domain-events/server'
import { sites } from '#layers/pro-saas/server/database'
import { defineProApiHandler, getProLogger } from '#layers/pro-saas/server/utils/handler'

export default defineProApiHandler(async (event) => {
  const access = await requireTeamSite(event, { ability: 'manage-sites' })
  const { db, site, team, caller } = access

  await dispatchEvent('pro:site:removed', {
    event,
    siteId: site.siteId,
    teamId: team.teamId,
    userId: caller.user.id,
    gscdumpSiteId: site.gscdumpSiteId,
  }).catch(err => getProLogger(event).error('pro:site:removed hook failed', err))

  // Each table's delete is written out individually (rather than looped over
  // a shared array of table refs) so drizzle keeps each `siteId` column's own
  // brand — a generic loop over mixed table types loses that and breaks typing.
  const childDeletes: Array<() => Promise<unknown>> = [
    () => db.delete(relatedKeywords).where(eq(relatedKeywords.siteId, site.siteId)),
    () => db.delete(siteDateAnalytics).where(eq(siteDateAnalytics.siteId, site.siteId)),
    () => db.delete(siteDateCountryAnalytics).where(eq(siteDateCountryAnalytics.siteId, site.siteId)),
    () => db.delete(sitePathDateAnalytics).where(eq(sitePathDateAnalytics.siteId, site.siteId)),
    () => db.delete(siteKeywordDateAnalytics).where(eq(siteKeywordDateAnalytics.siteId, site.siteId)),
    () => db.delete(siteKeywordDatePathAnalytics).where(eq(siteKeywordDatePathAnalytics.siteId, site.siteId)),
    () => db.delete(sitePaths).where(eq(sitePaths.siteId, site.siteId)),
    () => db.delete(usages).where(eq(usages.siteId, site.siteId)),
    () => db.delete(userSites).where(eq(userSites.siteId, site.siteId)),
    () => db.delete(teamSites).where(eq(teamSites.siteId, site.siteId)),
    () => db.delete(indexingJobs).where(eq(indexingJobs.siteId, site.siteId)),
    () => db.delete(indexingInvestigations).where(eq(indexingInvestigations.siteId, site.siteId)),
  ]

  const warnings: string[] = []
  for (const run of childDeletes) {
    await run().catch((err: unknown) => {
      warnings.push(err instanceof Error ? err.message : String(err))
    })
  }

  await db.delete(sites).where(eq(sites.siteId, site.siteId))

  return { success: true, siteId: site.publicId, warnings }
})

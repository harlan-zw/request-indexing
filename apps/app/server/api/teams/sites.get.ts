import { and, eq } from 'drizzle-orm'
import { teamSites } from '~~/layers/core/server/db/schema'
import { sites } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

// Sites linked to the caller's current team via `team_sites`. `team_sites`
// predates the pro-saas augment and isn't re-exported by the `#schema`
// surface, so it's imported straight from the core schema.
export default defineProApiHandler({ team: true }, async ({ team: ctx }) => {
  return await ctx.db.select({
    siteId: sites.publicId,
    domain: sites.domain,
    property: sites.property,
  })
    .from(sites)
    .innerJoin(teamSites, and(eq(sites.siteId, teamSites.siteId), eq(teamSites.teamId, ctx.team.teamId)))
    .where(eq(sites.active, true))
    .all()
})

// Team-scoped site resolver for `/api/sites/[siteId]/*` routes.
//
// `requireSiteAccess` (pro-saas) is owner-only and reads route param `id`
// (its own docs: "team-scoped site access will be reintroduced once the V1
// portfolio dashboard ships") — this route family uses `[siteId]` and needs
// team membership, not raw ownership, so it doesn't fit. This is that
// team-scoped counterpart: resolve the caller's current team, then verify
// the site (looked up by its public id, never the internal integer PK) is
// linked to that team via `team_sites`.
import type { H3Event } from 'h3'
import type { RequireCurrentTeamOptions } from '#layers/pro-saas/server/utils/require-current-team'
import { and, eq } from 'drizzle-orm'
import { teamSites } from '~~/layers/core/server/db/schema'
import { sites } from '#layers/pro-saas/server/database'

export async function requireTeamSite(event: H3Event, options?: RequireCurrentTeamOptions) {
  const team = await requireCurrentTeam(event, options)
  const siteIdParam = getRouterParam(event, 'siteId')
  if (!siteIdParam)
    throw createError({ statusCode: 400, message: 'Missing site ID' })

  const row = await team.db.select({ site: sites })
    .from(sites)
    .innerJoin(teamSites, and(eq(sites.siteId, teamSites.siteId), eq(teamSites.teamId, team.team.teamId)))
    .where(eq(sites.publicId, siteIdParam))
    .get()

  if (!row)
    throw createError({ statusCode: 404, message: 'Site not found' })

  return { ...team, site: row.site }
}

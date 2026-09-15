// Current-team site resolver for the `/api/sites/[siteId]/*` route family,
// which names its param `siteId` rather than the `id` `requireSiteAccess`
// reads. Both now answer the same question: is this site's owning team the
// caller's team.
import type { H3Event } from 'h3'
import type { RequireCurrentTeamOptions } from '#layers/pro-saas/server/utils/require-current-team'
import { and, eq } from 'drizzle-orm'
import { sites } from '#layers/pro-saas/server/database'
import { normalizeSiteRef } from '#layers/pro-saas/shared/site-access'

export async function requireTeamSite(event: H3Event, options?: RequireCurrentTeamOptions) {
  const team = await requireCurrentTeam(event, options)
  const ref = normalizeSiteRef(getRouterParam(event, 'siteId'))
  if (ref._tag === 'Missing')
    throw createError({ statusCode: 400, message: 'Missing site ID' })

  const site = ref._tag === 'PublicId' || ref._tag === 'Uuid'
    ? await team.db.select().from(sites).where(and(
        ref._tag === 'PublicId' ? eq(sites.publicId, ref.publicId) : eq(sites.id, ref.id),
        eq(sites.teamId, team.team.teamId),
      )).get()
    : undefined

  if (!site)
    throw createError({ statusCode: 404, message: 'Site not found' })

  return { ...team, site }
}

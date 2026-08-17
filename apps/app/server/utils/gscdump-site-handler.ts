import type { H3Event } from 'h3'

// Every `/api/gscdump/[siteId]/*` route repeated the same six lines:
// authenticate, look the site up by `publicId`, 404 when it has no
// `gscdumpSiteId`. None of them checked that the caller may see that site, so
// any signed-in user could read another team's Search Console data, and submit
// a sitemap to another team's property, by guessing a public id.
//
// The lookup is the thing that was easy to get wrong, so it is no longer
// something a route author writes. `defineGscdumpSiteHandler` resolves the site
// through `requireTeamSite` (team membership, by public id) and hands the
// handler a site that is already proven both accessible and registered. A new
// route in this family cannot skip the check without deliberately not using
// this helper.

export interface GscdumpSiteContext {
  event: H3Event
  /** The gscdump engine id. Never a router slug: do not build URLs from it. */
  gscdumpSiteId: string
  site: Awaited<ReturnType<typeof requireTeamSite>>['site']
  team: Awaited<ReturnType<typeof requireTeamSite>>['team']
}

export function defineGscdumpSiteHandler<T>(handler: (ctx: GscdumpSiteContext) => Promise<T> | T) {
  return defineEventHandler(async (event) => {
    const { site, team } = await requireTeamSite(event)

    if (!site.gscdumpSiteId) {
      throw createError({ statusCode: 404, message: 'This site is not connected to Search Console yet.' })
    }

    return handler({ event, site, team, gscdumpSiteId: site.gscdumpSiteId })
  })
}

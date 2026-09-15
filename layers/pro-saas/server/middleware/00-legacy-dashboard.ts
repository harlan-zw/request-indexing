import { and, inArray, or } from 'drizzle-orm'
import { getRequestURL, sendRedirect } from 'h3'
import { logger } from '~~/shared/server/logger'
import { sites } from '#layers/pro-saas/server/database'
import {
  legacySiteSlugCandidates,
  mapLegacyDashboardRoute,
  siteRedirectPath,
} from '../../shared/legacy-dashboard-routes'
import { normalizeSiteRef } from '../../shared/site-access'
import { getCaller } from '../utils/get-caller'

// Old dashboard links keep working. A route rule could only swap the prefix,
// and half the old pages moved further than that.
//
// The old per-site URL carried the site's DOMAIN. The new one carries the
// site's `s_` public id, so a legacy site link is resolved here before anyone
// is sent anywhere: `/dashboard/site/harlanzw.com/overview` used to redirect
// straight to `/pro/dashboard/sites/harlanzw.com/search-console`, an id that
// names no Site (D6).
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const route = mapLegacyDashboardRoute(url.pathname)

  if (route._tag === 'NoMatch')
    return

  if (route._tag === 'Redirect')
    return sendRedirect(event, `${route.path}${url.search}`, 301)

  // A slug the new tree can already address: a public id or the canonical UUID.
  // That mapping is fixed, so it stays a permanent redirect.
  const ref = normalizeSiteRef(route.slug)
  if (ref._tag === 'PublicId' || ref._tag === 'Uuid')
    return sendRedirect(event, `${siteRedirectPath(route.slug, route.page)}${url.search}`, 301)

  // A domain slug. It only resolves against the caller's own Sites, so the
  // answer is per caller and never cacheable.
  const caller = await getCaller(event)
  if (!caller) {
    // Nobody to resolve the slug against. The roster is the honest landing;
    // the app's auth guard sends a signed-out visitor on to the login page.
    // `safeAuthRedirect` rejects `/dashboard/*` by design, so the legacy path
    // cannot ride along as a post-login target.
    return sendRedirect(event, '/pro/dashboard', 302)
  }

  const teamIds = caller.memberships.map(m => m.teamId)
  const candidates = legacySiteSlugCandidates(route.slug)
  const match = teamIds.length
    ? await useDrizzle(event)
        .select({ publicId: sites.publicId })
        .from(sites)
        .where(and(
          inArray(sites.teamId, teamIds),
          or(inArray(sites.domain, candidates), inArray(sites.property, candidates)),
        ))
        .get()
        .catch((error: unknown) => {
          logger.error('[legacy-dashboard] site slug lookup failed:', error)
          return undefined
        })
    : undefined

  if (!match)
    throw createError({ statusCode: 404, statusMessage: 'Site not found' })

  return sendRedirect(event, `${siteRedirectPath(match.publicId, route.page)}${url.search}`, 302)
})

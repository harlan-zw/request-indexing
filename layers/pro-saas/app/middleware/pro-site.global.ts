// An id that names no Site answers 404, on the server render as well as on a
// client navigation.
//
// Before this, `useSite` swallowed the endpoint's 404 and the page read the
// resulting null Site as "Search Console is not connected yet", so
// `/pro/dashboard/sites/s_nope/search-console` returned 200 and rendered the
// sample-data shell (D5). Resolving the Site here makes the ROUTE agree with
// the endpoint, and follows the same shape as `pro-feature-flag.global.ts`.
//
// The lookup is stored on the payload under the shared Site key, so
// `useSiteResource` replays it rather than repeating the request.

import type { $Fetch } from 'nitropack'
import type { SiteLookup } from '../../shared/site-lookup'
import { extractSiteRouteId, readSiteLookup, siteLookupKey } from '../../shared/site-lookup'

export default defineNuxtRouteMiddleware(async (to) => {
  const siteId = extractSiteRouteId(to.path)
  if (!siteId)
    return

  const nuxtApp = useNuxtApp()
  const key = siteLookupKey(siteId)

  // Hydration replays the server's answer; re-running the fetch here would
  // duplicate it on the first client render.
  const replayed = nuxtApp.isHydrating ? nuxtApp.payload.data[key] as SiteLookup | undefined : undefined
  const lookup = replayed ?? await readSiteLookup(url => (nuxtApp.$proFetch as $Fetch)(url), siteId)

  nuxtApp.payload.data[key] = lookup

  if (lookup._tag === 'NotFound')
    return abortNavigation(createError({ statusCode: 404, statusMessage: 'Site not found' }))
})

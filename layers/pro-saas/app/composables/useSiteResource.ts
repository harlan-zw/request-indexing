import type { MaybeRefOrGetter } from 'vue'
import type { SiteLookup, SiteResource } from '../../shared/site-lookup'
import { readSiteLookup, siteLookupKey } from '../../shared/site-lookup'

/**
 * The one read of `/api/pro/sites/:id` a Site page makes.
 *
 * Every consumer of the same Site shares one `useAsyncData` key, and
 * `pro-site.global.ts` has already resolved the current route's Site before the
 * page mounts, so this replays that payload instead of asking again.
 *
 * The result is a `SiteLookup`, not a nullable Site: a page that renders a
 * fallback must say which of "no such Site" and "the read failed" it is
 * rendering for.
 */
export function useSiteResource(siteId: MaybeRefOrGetter<string>) {
  const proFetch = useProFetch()
  const { data: lookup, status } = useAsyncData<SiteLookup>(
    () => siteLookupKey(toValue(siteId)),
    () => readSiteLookup(url => proFetch(url), toValue(siteId)),
    {
      watch: [() => toValue(siteId)],
      // Both `useSite` and `useProGscStatus` ask for the same Site in the same
      // setup pass. `defer` joins them onto one request instead of the second
      // aborting the first.
      dedupe: 'defer',
      getCachedData: (key, nuxtApp, ctx) => ctx.cause === 'initial' || nuxtApp.isHydrating
        ? nuxtApp.payload.data[key] as SiteLookup | undefined
        : undefined,
    },
  )

  const site = computed<SiteResource | null>(() => lookup.value?._tag === 'Found' ? lookup.value.site : null)

  return { lookup, site, status }
}

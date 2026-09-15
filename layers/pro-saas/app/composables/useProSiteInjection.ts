import type { MaybeRefOrGetter } from 'vue'
import type { SiteLookup, SiteResource } from '../../shared/site-lookup'
import { readSiteLookup, siteLookupKey } from '../../shared/site-lookup'

/**
 * Inject the layout's Site, or fetch it when used outside the layout.
 *
 * Ported from nuxtseo.com `layers/pro/sites/app/composables/useProSiteInjection.ts`.
 * The `pro-dashboard` layout resolves the route's Site once and `provide`s it;
 * everything under the layout consumes that one read. A component mounted with
 * a Site the layout is not scoped to (a card on the roster, say) falls back to
 * its own lazy fetch on the same key.
 *
 * This is the private primitive. `useSite()` is the page-level read (ADR-0012
 * on nuxtseo.com); `useProGscStatus` is the other sanctioned direct consumer.
 */
export function useProSiteInjection(siteId: MaybeRefOrGetter<string>) {
  const providedSite = inject<Ref<SiteResource | null> | undefined>('site', undefined)
  const providedStatus = inject<Ref<string> | undefined>('siteStatus', undefined)
  const injectedSite = providedSite ?? ref<SiteResource | null>(null)
  const injectedStatus = providedStatus ?? ref('idle')

  const wantedId = computed(() => toValue(siteId))
  // The layout only speaks for the Site in the route. Anything else fetches.
  const injectionAnswers = computed(() => {
    if (providedSite === undefined)
      return false
    const site = injectedSite.value
    if (!site)
      return injectedStatus.value !== 'success'
    return site.publicId === wantedId.value || site.id === wantedId.value
  })

  const proFetch = useProFetch()
  const shouldFetch = computed(() => !!wantedId.value && !injectionAnswers.value)
  const { data: fetched, status: fetchedStatus } = useAsyncData<SiteLookup | null>(
    () => siteLookupKey(wantedId.value || 'none'),
    () => shouldFetch.value ? readSiteLookup(url => proFetch(url), wantedId.value) : Promise.resolve(null),
    {
      watch: [wantedId, shouldFetch],
      immediate: shouldFetch.value,
      dedupe: 'defer',
    },
  )

  const site = computed<SiteResource | null>(() => {
    if (injectionAnswers.value)
      return injectedSite.value
    return fetched.value?._tag === 'Found' ? fetched.value.site : null
  })

  const siteStatus = computed(() => {
    if (injectionAnswers.value)
      return injectedStatus.value
    if (fetched.value && fetched.value._tag !== 'Found')
      return 'error'
    return fetchedStatus.value
  })

  return { site, siteStatus }
}

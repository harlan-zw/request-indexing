import type {
  GscdumpSitemapChangesResponse,
  GscdumpSitemapsResponse,
} from '../../../shared/gscdump-api'
import type { GscdumpQueryOptions } from './_internal'
import { useGscdumpQuery } from './_internal'

/**
 * Fetch GSC sitemaps with useAsyncData caching
 */
export function useProGscdumpSitemaps(siteId: MaybeRefOrGetter<string | undefined>, options?: GscdumpQueryOptions) {
  return useGscdumpQuery<GscdumpSitemapsResponse>(
    computed(() => `gscdump:sitemaps:${toValue(siteId)}`),
    siteId,
    (id, gscdump) => gscdump.getSiteSitemaps({ params: { siteId: id } }),
    [],
    options,
  )
}

/**
 * Fetch sitemap URL changes (added/removed) with useAsyncData caching
 */
export function useProGscdumpSitemapChanges(siteId: MaybeRefOrGetter<string | undefined>, days?: MaybeRefOrGetter<number>, options?: GscdumpQueryOptions) {
  const _days = computed(() => toValue(days) ?? 7)
  return useGscdumpQuery<GscdumpSitemapChangesResponse>(
    computed(() => `gscdump:sitemap-changes:${toValue(siteId)}:${_days.value}`),
    siteId,
    (id, gscdump) => gscdump.getSiteSitemapChanges({ params: { siteId: id }, query: { days: _days.value } }),
    [_days],
    options,
  )
}

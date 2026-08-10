import type {
  GscdumpIndexingDiagnosticsResponse,
  GscdumpIndexingResponse,
  GscdumpIndexingUrlsResponse,
  GscdumpInspectRateLimited,
  GscdumpInspectResponse,
} from '../../../shared/gscdump-api'
import type { GscdumpQueryOptions } from './_internal'
import { partnerRoutes } from '@gscdump/contracts'
import { useGscdumpQuery } from './_internal'
import { useProGscdump } from './useProGscdump'

/**
 * Fetch indexing data with useAsyncData caching
 */
export function useProGscdumpIndexing(siteId: MaybeRefOrGetter<string>, days?: MaybeRefOrGetter<number>, options?: GscdumpQueryOptions) {
  const _days = computed(() => toValue(days) ?? 28)
  return useGscdumpQuery<GscdumpIndexingResponse>(
    computed(() => `gscdump:indexing:${toValue(siteId)}:${_days.value}`),
    siteId,
    (id, gscdump) => gscdump.getSiteIndexing({ params: { siteId: id }, query: { days: _days.value } }),
    [_days],
    options,
  )
}

/**
 * Fetch indexing URLs with useAsyncData caching
 */
export function useProGscdumpIndexingUrls(
  siteId: MaybeRefOrGetter<string>,
  params?: MaybeRefOrGetter<{
    limit?: number
    offset?: number
    status?: 'indexed' | 'not_indexed' | 'pending'
    issue?: string
    search?: string
  }>,
  options?: GscdumpQueryOptions,
) {
  const _params = computed(() => toValue(params) ?? {})
  return useGscdumpQuery<GscdumpIndexingUrlsResponse>(
    computed(() => `gscdump:indexing-urls:${toValue(siteId)}:${JSON.stringify(_params.value)}`),
    siteId,
    (id, gscdump) => gscdump.listSiteIndexingUrls({ params: { siteId: id }, query: _params.value }),
    [_params],
    options,
  )
}

/**
 * Fetch indexing diagnostics with useAsyncData caching
 */
export function useProGscdumpIndexingDiagnostics(siteId: MaybeRefOrGetter<string>, options?: GscdumpQueryOptions) {
  return useGscdumpQuery<GscdumpIndexingDiagnosticsResponse>(
    computed(() => `gscdump:indexing-diagnostics:${toValue(siteId)}`),
    siteId,
    (id, gscdump) => gscdump.getSiteIndexingDiagnostics({ params: { siteId: id }, query: {} }),
    [],
    options,
  )
}

/**
 * Imperative trigger: manually re-inspect 1..10 URLs against Google's URL
 * Inspection API. Consumes the site's daily 1800-request budget. Caller is
 * responsible for showing toasts; pass `silent` so the shared error toast
 * doesn't fire on the 429 rate-limit response (which we handle inline).
 */
export function useProGscdumpInspectUrls() {
  const gscdump = useProGscdump()
  return async (siteId: string, urls: string[]): Promise<GscdumpInspectResponse | GscdumpInspectRateLimited> => {
    return gscdump.fetchGscdump<GscdumpInspectResponse | GscdumpInspectRateLimited>(
      partnerRoutes.sites.indexingInspect(siteId),
      { method: 'POST', body: { urls }, silent: true },
    )
  }
}

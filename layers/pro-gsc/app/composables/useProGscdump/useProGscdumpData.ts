import type {
  BuilderState,
  GscComparisonFilter,
  GscdumpDataResponse,
  GscdumpMeta,
  GscdumpTotals,
} from '../../../shared/gscdump-api'
import type { GscdumpQueryOptions } from './_internal'
import { useGscSiteInvalidation } from '../../internal/composables/useGscInvalidation'
import { useTrackGscEngine } from '../useGscEngineStats'
import { useGscQuery } from '../useGscQuery'
import { useProGscdump } from './useProGscdump'

/**
 * Fetch GSC data with useAsyncData caching
 */
export function useProGscdumpData(
  siteId: MaybeRefOrGetter<string>,
  state: MaybeRefOrGetter<BuilderState>,
  options?: {
    comparison?: MaybeRefOrGetter<BuilderState | undefined>
    filter?: MaybeRefOrGetter<GscComparisonFilter | undefined>
  } & GscdumpQueryOptions,
) {
  const _state = computed(() => toValue(state))
  const _comparison = computed(() => toValue(options?.comparison))
  const _filter = computed(() => toValue(options?.filter))
  const _siteId = computed(() => toValue(siteId))

  const params = computed(() => ({
    type: 'data-query' as const,
    q: _state.value,
    ...(_comparison.value ? { qc: _comparison.value } : {}),
    ...(_filter.value ? { comparisonFilter: _filter.value } : {}),
  }))

  const gscdump = useProGscdump()

  const result = useGscQuery<GscdumpDataResponse>({
    site: _siteId,
    params,
    enabled: computed(() => !!_siteId.value),
    watchSources: [useGscSiteInvalidation(_siteId)],
    reshape: (raw) => {
      const meta = (raw.meta ?? {}) as Record<string, unknown>
      return {
        rows: (raw.results ?? []) as unknown as GscdumpDataResponse['rows'],
        totalCount: Number(meta.totalCount ?? (raw.results?.length ?? 0)),
        totals: (meta.totals as GscdumpTotals | undefined) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        meta: meta as unknown as GscdumpMeta,
      }
    },
    serverFallback: async (id) => {
      return gscdump.queryAnalyticsReport({
        params: { siteId: id },
        body: {
          state: _state.value,
          ...(_comparison.value ? { comparison: _comparison.value } : {}),
          ...(_filter.value ? { filter: _filter.value } : {}),
        },
      })
    },
  })
  useTrackGscEngine(result)
  return result
}

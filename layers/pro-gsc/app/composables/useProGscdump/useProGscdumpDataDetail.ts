import type {
  BuilderState,
  GscdumpDataDetailResponse,
  GscdumpMeta,
  GscdumpTotals,
} from '../../../shared/gscdump-api'
import type { GscdumpQueryOptions } from './_internal'
import { useGscSiteInvalidation } from '../../internal/composables/useGscInvalidation'
import { useTrackGscEngine } from '../useGscEngineStats'
import { useGscQuery } from '../useGscQuery'
import { useProGscdump } from './useProGscdump'

/**
 * Fetch GSC data detail (daily breakdown).
 *
 * Routes through the consumer-owned `useGscQuery`, which executes the explicit
 * hosted report operation. No hidden browser or legacy endpoint is selected.
 */
export function useProGscdumpDataDetail(
  siteId: MaybeRefOrGetter<string>,
  state: MaybeRefOrGetter<BuilderState>,
  options?: {
    comparison?: MaybeRefOrGetter<BuilderState | undefined>
  } & GscdumpQueryOptions,
) {
  const _state = computed(() => toValue(state))
  const _comparison = computed(() => toValue(options?.comparison))
  const _siteId = computed(() => toValue(siteId))

  const params = computed(() => ({
    type: 'data-detail' as const,
    q: _state.value,
    ...(_comparison.value ? { qc: _comparison.value } : {}),
  }))

  const gscdump = useProGscdump()

  const result = useGscQuery<GscdumpDataDetailResponse>({
    site: _siteId,
    params,
    enabled: computed(() => !!_siteId.value),
    watchSources: [useGscSiteInvalidation(_siteId)],
    reshape: (raw) => {
      const meta = (raw.meta ?? {}) as Record<string, unknown>
      const out: GscdumpDataDetailResponse = {
        daily: (raw.results ?? []) as unknown as GscdumpDataDetailResponse['daily'],
        totals: (meta.totals as GscdumpTotals | undefined) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        meta: meta as unknown as GscdumpMeta,
      }
      if (meta.previousTotals)
        out.previousTotals = meta.previousTotals as GscdumpTotals
      return out
    },
    serverFallback: async (id) => {
      return gscdump.queryAnalyticsReportDetail({
        params: { siteId: id },
        body: {
          state: _state.value,
          ...(_comparison.value ? { comparison: _comparison.value } : {}),
        },
      })
    },
  })
  useTrackGscEngine(result)
  return result
}

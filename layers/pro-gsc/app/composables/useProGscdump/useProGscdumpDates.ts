import type { BuilderState } from '../../../shared/gscdump-api'
import type { CompareMode, Period } from '../useGscPeriod'
import type { GscdumpQueryOptions } from './_internal'
import { andFilter, dateFilter } from '../../../shared/utils/filter-wire'
import { useProGscdumpDataDetail } from './useProGscdumpDataDetail'

export interface DailySeriesFilter { column: 'page' | 'query' | 'queryCanonical' | 'country' | 'device', value: string }

/**
 * Fetch daily series for a period with optional comparison overlay.
 *
 * Without `filter` → site-wide overview (current + prev daily series, totals).
 * With `filter` → drill-down (single dimension value, e.g. one page or keyword).
 * When `withPrevSeries: false` (default when `filter` is set), skips the prev
 * daily-series fetch — callers that don't render an overlay save a round-trip.
 *
 * Both paths inherit the hosted v1/server routing from
 * `useProGscdumpDataDetail`.
 */
export function useProGscdumpDates(
  siteId: MaybeRefOrGetter<string | null | undefined>,
  period: MaybeRefOrGetter<Period>,
  opts?: {
    stableData?: MaybeRefOrGetter<boolean>
    compareMode?: MaybeRefOrGetter<CompareMode>
    filter?: MaybeRefOrGetter<DailySeriesFilter | undefined>
    /** Fetch prev-period daily series for chart overlay. Defaults to `true` for site-wide, `false` when `filter` is set. */
    withPrevSeries?: boolean
  } & GscdumpQueryOptions,
) {
  const _siteId = computed(() => toValue(siteId) ?? '')
  const _period = computed(() => toValue(period))
  const _stableData = computed(() => toValue(opts?.stableData) ?? true)
  const _compareMode = computed(() => toValue(opts?.compareMode) ?? 'previous')
  const _filter = computed(() => toValue(opts?.filter))
  const withPrevSeries = opts?.withPrevSeries ?? (opts?.filter === undefined)

  const range = computed(() => periodToDateRange(_period.value, _stableData.value))
  const cmp = computed(() => compareRange(range.value, _compareMode.value))

  function rangeFilter(r: { start: string, end: string }) {
    const eq = _filter.value
    return eq ? andFilter(dateFilter(r), { type: 'eq', column: eq.column, value: eq.value }) : dateFilter(r)
  }

  const currentState = computed<BuilderState>(() => ({
    dimensions: ['date'],
    filter: rangeFilter(range.value),
    orderBy: { column: 'date', dir: 'asc' },
  }))

  const comparisonState = computed<BuilderState | undefined>(() => {
    const c = cmp.value
    if (!c)
      return undefined
    return { dimensions: ['date'], filter: rangeFilter(c) }
  })

  const prevState = computed<BuilderState | undefined>(() => {
    if (!withPrevSeries)
      return undefined
    const c = cmp.value
    if (!c)
      return undefined
    return {
      dimensions: ['date'],
      filter: rangeFilter(c),
      orderBy: { column: 'date', dir: 'asc' },
    }
  })

  const current = useProGscdumpDataDetail(_siteId, currentState, { comparison: comparisonState })
  const prev = withPrevSeries
    ? useProGscdumpDataDetail(_siteId, computed(() => prevState.value ?? currentState.value), {})
    : null

  const data = computed(() => {
    const result = current.data.value
    if (!result)
      return null
    const hasPrevData = !!result.previousTotals
    return {
      dates: result.daily,
      prevDates: hasPrevData && cmp.value && prev?.data.value?.daily ? prev.data.value.daily : null,
      period: result.totals,
      prevPeriod: result.previousTotals ?? null,
      meta: result.meta,
      hasPrevData,
    }
  })

  return {
    data,
    status: current.status,
    pending: current.pending,
    error: current.error,
    refresh: async () => {
      await Promise.all([current.refresh(), prev ? prev.refresh() : Promise.resolve()])
    },
  }
}

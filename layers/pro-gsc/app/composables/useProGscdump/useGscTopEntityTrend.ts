import type { Metric } from 'gscdump/query'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { TopEntityDayRow, TopEntityStackResult } from '~~/layers/design-system/app/utils/topEntityStack'
import type { BuilderState, GscdumpDataRow } from '../../../shared/gscdump-api'
import type { GscFacet } from '../../../shared/utils/gsc-facets'
import { country as countryColumn, inArray, page as pageColumn, queryCanonical } from 'gscdump/query'
import { onScopeDispose, ref, shallowRef, toValue, watch } from 'vue'
import { bucketTopEntities } from '~~/layers/design-system/app/utils/topEntityStack'
import { isSearchOperatorQuery } from '../../../shared/search-operator-queries'
import { andFilter, dateFilter } from '../../../shared/utils/filter-wire'
import { facetsToFilters } from '../../../shared/utils/gsc-facets'
import { useProGscFilters } from '../useProGscFilters'
import { useProGscdump } from './useProGscdump'

export type GscTrendDimension = 'query' | 'page' | 'country'

export interface UseGscTopEntityTrendOptions {
  /** gscdump site id. */
  gscdumpSiteId: MaybeRefOrGetter<string | null | undefined>
  dimension: GscTrendDimension
  metric: MaybeRefOrGetter<Metric>
  range: MaybeRefOrGetter<{ start: string, end: string }>
  /** How many entities stay named before the rest roll into "Other". */
  topN?: MaybeRefOrGetter<number>
  maxBuckets?: number
  facets?: MaybeRefOrGetter<readonly GscFacet[] | undefined>
}

// Queries rank and plot by `queryCanonical`, not the raw query. The raw
// dimension splits one search intent across every casing and spacing variant,
// so the top five raw strings hold a tiny share of the total and the residual
// "Other" band swallows the chart.
const TREND_DIMENSION = {
  query: 'queryCanonical',
  page: 'page',
  country: 'country',
} as const

const TREND_COLUMNS = {
  query: queryCanonical,
  page: pageColumn,
  country: countryColumn,
} as const

/**
 * Top N entities over time, feeding `UiTopEntityStackChart` through the shared
 * `bucketTopEntities` bucketing. Three reads: the ranked candidates, the site's
 * own daily total (the "Other" residual is total minus the named bands), and
 * the named entities' daily series.
 */
export function useGscTopEntityTrend(opts: UseGscTopEntityTrendOptions): {
  result: Ref<TopEntityStackResult>
  pending: Ref<boolean>
  error: Ref<Error | null>
  refresh: () => Promise<void>
} {
  const gscdump = useProGscdump()
  const result = shallowRef<TopEntityStackResult>({ buckets: [], series: [] })
  const pending = ref(false)
  const error = ref<Error | null>(null)
  const filters = useProGscFilters()
  const dimension = TREND_DIMENSION[opts.dimension]
  const column = TREND_COLUMNS[opts.dimension]

  let token = 0
  // A refetch that outlives its panel must stop at its next checkpoint rather
  // than keep reading against a torn-down scope.
  let stopped = false
  onScopeDispose(() => {
    stopped = true
    token++
  })

  async function readRows(siteId: string, state: BuilderState): Promise<GscdumpDataRow[] | null> {
    return gscdump.queryAnalyticsReport({ params: { siteId }, body: { state } }, true)
      .then(response => (response?.rows ?? []) as GscdumpDataRow[])
      .catch((cause: unknown) => {
        error.value = cause instanceof Error ? cause : new Error('Search trend could not load.')
        return null
      })
  }

  async function refetch(): Promise<void> {
    const current = ++token
    error.value = null
    const siteId = toValue(opts.gscdumpSiteId)
    const metric = toValue(opts.metric)
    const range = toValue(opts.range)
    const topN = toValue(opts.topN) ?? 5
    const maxBuckets = opts.maxBuckets ?? 10
    const facetFilters = facetsToFilters(toValue(opts.facets))
    // Operator rows are dropped after the ranking, so over-fetch to keep the
    // named band count intact.
    const candidateLimit = Math.max(topN + 2, 7) + (opts.dimension === 'query' ? 10 : 0)

    if (!import.meta.client || stopped || !siteId || !range?.start || !range?.end) {
      result.value = { buckets: [], series: [] }
      pending.value = false
      return
    }
    pending.value = true
    result.value = { buckets: [], series: [] }

    const where = andFilter(dateFilter(range), ...facetFilters)
    const candidates = await readRows(siteId, {
      dimensions: [dimension],
      filter: where,
      orderBy: { column: metric, dir: metric === 'position' ? 'asc' : 'desc' },
      rowLimit: candidateLimit,
    })
    if (current !== token || !candidates) {
      pending.value = false
      return
    }

    const rankTotals = new Map<string, number>()
    for (const row of candidates) {
      const key = String((row as unknown as Record<string, unknown>)[dimension] ?? '')
      if (!key || (opts.dimension === 'query' && isSearchOperatorQuery(key)))
        continue
      const value = Number((row as unknown as Record<string, unknown>)[metric] ?? 0) || 0
      // The breakdown orders by the metric but never filters on it, so a site
      // with almost no clicks ranks zero-click queries as its top queries and
      // every named band is flat. A zero-valued candidate is not a top entity.
      if (value <= 0 && (metric === 'clicks' || metric === 'impressions'))
        continue
      rankTotals.set(key, value)
    }

    const mergedKeys = [...rankTotals.entries()]
      .sort((a, b) => metric === 'position' ? a[1] - b[1] : b[1] - a[1])
      .slice(0, topN)
      .map(([key]) => key)

    if (!mergedKeys.length) {
      result.value = { buckets: [], series: [] }
      pending.value = false
      return
    }

    const [totalRows, entityRows] = await Promise.all([
      readRows(siteId, { dimensions: ['date'], filter: where, rowLimit: 25_000 }),
      readRows(siteId, {
        dimensions: [dimension, 'date'],
        filter: andFilter(dateFilter(range), inArray(column, mergedKeys), ...facetFilters),
        rowLimit: 25_000,
      }),
    ])
    if (current !== token || !totalRows || !entityRows) {
      pending.value = false
      return
    }

    const totalsByDate = new Map<string, number>()
    for (const row of totalRows) {
      if (row.date)
        totalsByDate.set(row.date, Number((row as unknown as Record<string, unknown>)[metric] ?? 0) || 0)
    }
    const dayRows: TopEntityDayRow[] = []
    for (const row of entityRows) {
      const key = String((row as unknown as Record<string, unknown>)[dimension] ?? '')
      if (!key || !row.date || !mergedKeys.includes(key))
        continue
      dayRows.push({ date: row.date, key, label: key, value: Number((row as unknown as Record<string, unknown>)[metric] ?? 0) || 0 })
    }

    const dates = [...totalsByDate.keys()].sort()
    if (dates.length < 2) {
      result.value = { buckets: [], series: [] }
      pending.value = false
      return
    }

    result.value = bucketTopEntities({
      dates,
      rows: dayRows,
      totals: dates.map(d => totalsByDate.get(d) ?? 0),
      topN,
      maxBuckets,
      excludeKey: opts.dimension === 'query' ? isSearchOperatorQuery : undefined,
    })
    pending.value = false
  }

  if (import.meta.client) {
    watch(
      [
        () => toValue(opts.gscdumpSiteId),
        () => toValue(opts.metric),
        () => toValue(opts.range),
        () => opts.dimension,
        () => toValue(opts.topN),
        filters.searchType,
        () => toValue(opts.facets),
      ],
      refetch,
      { immediate: true, deep: true },
    )
  }

  return { result, pending, error, refresh: refetch }
}

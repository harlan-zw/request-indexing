import type { GscSearchType } from '@gscdump/contracts'
import type { Metric } from 'gscdump/query'
import type { MaybeRefOrGetter, Ref } from 'vue'
import type { BuilderState, GscdumpDataRow } from '../../../shared/gscdump-api'
import type { GscFacet } from '../../../shared/utils/gsc-facets'
import { country as countryColumn, inArray, page as pageColumn, queryCanonical, query as queryColumn } from 'gscdump/query'
import { computed, onScopeDispose, ref, toValue, watch } from 'vue'
import { andFilter, dateFilter } from '../../../shared/utils/filter-wire'
import { facetsToFilters } from '../../../shared/utils/gsc-facets'
import { sparklineDateAxis } from '../../../shared/utils/gsc-series'
import { useProGscFilters } from '../useProGscFilters'
import { useProGscdump } from './useProGscdump'

export { sparklineDateAxis }

/**
 * Resolve the daily sparkline series for a whole table page in one read.
 *
 * The per-row loader it replaces issued one request per visible row. Queries go
 * through the purpose-built `keyword-sparklines` operation, which answers up to
 * 20 keywords per call. Pages and countries have no such operation, so they run
 * one grouped `(dimension, date)` analytics report instead. Either way the
 * result is projected onto a shared day axis, so every series is the same
 * length and a missing day reads as zero rather than shortening the line.
 *
 * Each batch settles on its own. One pending flag over every batch held all 25
 * cells in their loading block until the slowest read returned, so a slow or
 * failed batch read as a permanent grey placeholder down the column.
 */

/** Keywords one `keyword-sparklines` request accepts. */
const SPARKLINE_KEYWORD_BATCH = 20

export interface UseProEntitySparklinesOptions {
  gscdumpSiteId: MaybeRefOrGetter<string | null | undefined>
  range: MaybeRefOrGetter<{ start: string, end: string }>
  dimension: 'query' | 'page' | 'queryCanonical' | 'country'
  /** Visible row keys: queries, page URLs or country codes. */
  keys: MaybeRefOrGetter<readonly string[]>
  /** Metric the sparkline plots. Defaults to `clicks`. */
  metric?: MaybeRefOrGetter<Metric>
  searchType?: MaybeRefOrGetter<GscSearchType>
  facets?: MaybeRefOrGetter<readonly GscFacet[] | undefined>
}

const DIMENSION_COLUMNS = {
  country: countryColumn,
  page: pageColumn,
  query: queryColumn,
  queryCanonical,
} as const

function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size))
  return out
}

export function useProEntitySparklines(opts: UseProEntitySparklinesOptions): {
  map: Ref<Map<string, number[]>>
  /** Shared `YYYY-MM-DD` day axis every series is projected onto. */
  dates: Ref<string[]>
  pending: Ref<boolean>
  /** True only while the batch carrying this key is in flight. */
  pendingFor: (key: string) => boolean
  error: Ref<Error | null>
} {
  const gscdump = useProGscdump()
  const map = ref<Map<string, number[]>>(new Map())
  const dates = ref<string[]>([])
  const unresolved = ref<Set<string>>(new Set())
  const pending = computed(() => unresolved.value.size > 0)
  const filters = useProGscFilters()
  const metric = computed(() => toValue(opts.metric) ?? 'clicks')
  const searchType = computed(() => toValue(opts.searchType) ?? filters.searchType.value)
  const error = ref<Error | null>(null)
  const cached = new Map<string, number[] | null>()
  let cacheScope = ''

  const isKeywordDimension = opts.dimension === 'query' || opts.dimension === 'queryCanonical'

  const _keys = computed(() => {
    const seen = new Set<string>()
    for (const k of toValue(opts.keys)) {
      if (k)
        seen.add(k)
    }
    return [...seen]
  })

  /** Keyword series straight from the purpose-built operation. */
  async function readKeywordSeries(
    siteId: string,
    range: { start: string, end: string },
    keys: string[],
    slice: GscSearchType,
  ): Promise<Map<string, Map<string, number>>> {
    const axis = sparklineDateAxis(range.start, range.end)
    const out = new Map<string, Map<string, number>>()
    const batch = await gscdump.queryKeywordSparklines<{ sparklines: Record<string, number[]> }>({
      params: { siteId },
      body: { keywords: keys, startDate: range.start, endDate: range.end, searchType: slice },
    }, true)
    for (const [key, series] of Object.entries(batch?.sparklines ?? {})) {
      const byDate = new Map<string, number>()
      series.forEach((value, index) => {
        const day = axis[index]
        if (day)
          byDate.set(day, Number(value) || 0)
      })
      out.set(key, byDate)
    }
    return out
  }

  /** Page and country series from one grouped `(dimension, date)` report. */
  async function readBreakdownSeries(
    siteId: string,
    range: { start: string, end: string },
    keys: string[],
    facets: readonly GscFacet[] | undefined,
  ): Promise<Map<string, Map<string, number>>> {
    const column = DIMENSION_COLUMNS[opts.dimension]
    const state: BuilderState = {
      dimensions: [opts.dimension, 'date'],
      filter: andFilter(
        dateFilter(range),
        inArray(column, keys),
        ...facetsToFilters(facets),
      ),
      // One row per key per day, plus headroom for a partial day bucket.
      rowLimit: Math.min(25_000, keys.length * (sparklineDateAxis(range.start, range.end).length + 1)),
    }
    const response = await gscdump.queryAnalyticsReport({ params: { siteId }, body: { state } }, true)
    const out = new Map<string, Map<string, number>>()
    for (const row of (response?.rows ?? []) as GscdumpDataRow[]) {
      const key = String((row as unknown as Record<string, unknown>)[opts.dimension] ?? '')
      const day = row.date
      if (!key || !day)
        continue
      let series = out.get(key)
      if (!series) {
        series = new Map()
        out.set(key, series)
      }
      series.set(day, Number((row as unknown as Record<string, unknown>)[metric.value] ?? 0) || 0)
    }
    return out
  }

  function publish(keys: readonly string[]): void {
    const next = new Map<string, number[]>()
    for (const key of keys) {
      const series = cached.get(key)
      if (series)
        next.set(key, series)
    }
    map.value = next
  }

  function settle(keys: readonly string[]): void {
    const next = new Set(unresolved.value)
    for (const key of keys)
      next.delete(key)
    unresolved.value = next
  }

  let token = 0
  onScopeDispose(() => token++)
  watch(
    [() => toValue(opts.gscdumpSiteId), () => toValue(opts.range), _keys, metric, searchType, () => toValue(opts.facets)],
    async ([siteId, range, keys, selectedMetric, selectedSearchType, facets]) => {
      const current = ++token
      error.value = null
      const nextScope = JSON.stringify([siteId, range, opts.dimension, selectedMetric, selectedSearchType, facets])
      if (nextScope !== cacheScope) {
        cached.clear()
        map.value = new Map()
        cacheScope = nextScope
      }
      if (!import.meta.client || !siteId || !keys.length || !range?.start || !range?.end) {
        map.value = new Map()
        dates.value = []
        unresolved.value = new Set()
        return
      }
      const axis = sparklineDateAxis(range.start, range.end)
      dates.value = axis
      const missing = keys.filter(k => !cached.has(k))
      publish(keys)
      unresolved.value = new Set(missing)
      if (missing.length === 0)
        return

      // Keyword reads are capped per request, so they run as several batches.
      // Page and country series come back in one grouped report.
      const batches = isKeywordDimension ? chunk(missing, SPARKLINE_KEYWORD_BATCH) : [missing]
      await Promise.all(batches.map(async (batch) => {
        const byEntity = await (isKeywordDimension
          ? readKeywordSeries(siteId, range, batch, selectedSearchType)
          : readBreakdownSeries(siteId, range, batch, facets)
        ).catch((cause: unknown) => {
          // A missing sparkline degrades to a dash in the cell, so the failure is
          // surfaced on the cell rather than as a toast over the whole table.
          if (current === token)
            error.value = cause instanceof Error ? cause : new Error('Trend data could not load.')
          return null
        })
        if (current !== token)
          return
        if (byEntity) {
          for (const key of batch)
            cached.set(key, null)
          for (const [key, series] of byEntity)
            cached.set(key, axis.map(d => series.get(d) ?? 0))
          publish(keys)
        }
        // A failed batch settles too: its cells read as no data, never as a
        // placeholder that outlives the request.
        settle(batch)
      }))
      if (current !== token)
        return
      dates.value = axis
      unresolved.value = new Set()
    },
    { immediate: true, deep: true },
  )

  return { map, dates, pending, pendingFor: (key: string) => unresolved.value.has(key), error }
}

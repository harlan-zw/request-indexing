// Cross-cutting GSC facet predicates, and the pure arithmetic behind the
// load-more table window.
//
// A facet is a filter that is NOT the table's own dimension: a country, a
// device, a brand-term regex on the canonical query. Every table merges the
// active facets into its `WHERE` before it ranks, so one definition here keeps
// the control bar, the table composable and the server request in agreement.
//
// Pure module: no Vue, no fetch. `gscdump/query` contributes column tokens only.
import type { Filter } from 'gscdump/query'
import { country, device, eq, notRegex, page as pageColumn, queryCanonical, query as queryColumn, regex } from 'gscdump/query'

/** Columns a facet may target. */
export type GscFacetColumn = 'country' | 'device' | 'page' | 'query' | 'queryCanonical'

/** Predicate applied on top of the date window, before the ranking. */
export interface GscFacet {
  column: GscFacetColumn
  op: 'eq' | 'regex' | 'notRegex'
  value: string
}

const FACET_COLUMNS = {
  country,
  device,
  page: pageColumn,
  query: queryColumn,
  queryCanonical,
} as const

/**
 * Compile one facet into a gscdump query filter. Returns `null` for a facet
 * with an empty value rather than emitting `column = ''`, which matches nothing
 * and silently blanks the table.
 */
export function facetToFilter(facet: GscFacet): Filter<object> | null {
  if (!facet.value)
    return null
  const column = FACET_COLUMNS[facet.column]
  if (facet.op === 'regex')
    return regex(column, facet.value) as Filter<object>
  if (facet.op === 'notRegex')
    return notRegex(column, facet.value) as Filter<object>
  return eq(column, facet.value) as Filter<object>
}

/** Compile a facet list, dropping the ones that carry no value. */
export function facetsToFilters(facets: readonly GscFacet[] | undefined | null): Filter<object>[] {
  return (facets ?? []).flatMap((facet) => {
    const filter = facetToFilter(facet)
    return filter ? [filter] : []
  })
}

/** Movers presets the table `filter` can carry. */
export const GSC_MOVERS_PRESETS = ['improving', 'declining', 'new', 'lost'] as const
export type GscMoversPreset = typeof GSC_MOVERS_PRESETS[number]

export function isMoversFilter(filter: string | undefined | null): filter is GscMoversPreset {
  return !!filter && (GSC_MOVERS_PRESETS as readonly string[]).includes(filter)
}

export interface BreakdownWindow {
  /** Rows to request. */
  limit: number
  /** Rows to skip. Always 0 in load-more mode. */
  offset: number
}

/**
 * The row window for one breakdown request.
 *
 * Paged mode walks a fixed-size window with an offset. Load-more mode grows the
 * limit instead and always starts at row 0, so the accumulated list is one
 * consistent ranking rather than a stitch of pages that reranked underneath the
 * user between requests.
 */
export function breakdownWindow(input: { loadMore: boolean, page: number, pageSize: number }): BreakdownWindow {
  const page = Math.max(1, Math.trunc(input.page) || 1)
  const pageSize = Math.max(1, Math.trunc(input.pageSize) || 1)
  if (input.loadMore)
    return { limit: page * pageSize, offset: 0 }
  return { limit: pageSize, offset: (page - 1) * pageSize }
}

/**
 * Whether a load-more table has rows beyond the ones it holds.
 *
 * With a reported distinct-group total the answer is exact. Without one, a full
 * last batch is treated as "probably more"; one extra click resolves the
 * exact-boundary case, which is cheaper than suppressing a real next page.
 */
export function hasMoreRows(input: {
  loadMore: boolean
  page: number
  pageSize: number
  loadedRows: number
  lastBatchRows: number
  totalRows?: number | null
}): boolean {
  if (!input.loadMore)
    return false
  if (typeof input.totalRows === 'number')
    return input.loadedRows < input.totalRows && input.lastBatchRows > 0
  return input.lastBatchRows >= input.page * input.pageSize
}

/** A row with traffic in the current window. `false` for prev-only join rows. */
export function hasCurrentWindowTraffic(row: Record<string, unknown>): boolean {
  return (Number(row.impressions) || 0) > 0 || (Number(row.clicks) || 0) > 0
}

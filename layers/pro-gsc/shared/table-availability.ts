/**
 * What a search-console table tells the page above it about its rows.
 *
 * The page uses it to decide whether to lead with a trend chart, so an
 * in-flight load must not read as "no rows". A table that reported
 * `available: false` while its first request was still open flipped the chart
 * off mid-hydration, and removing that subtree while Vue was still walking the
 * server-rendered DOM threw `insertBefore` out of the error boundary: Queries
 * and Pages rendered "Something went wrong" over data that had arrived.
 */
export type TableAvailability
  = | { _tag: 'loading' }
    | { _tag: 'settled', hasRows: boolean }

export function tableAvailability(state: {
  isLoading: boolean
  error: unknown
  rowCount: number
}): TableAvailability {
  if (state.isLoading)
    return { _tag: 'loading' }
  return { _tag: 'settled', hasRows: !state.error && state.rowCount > 0 }
}

import type { Filter } from 'gscdump/query'
import { and, between, date } from 'gscdump/query'

export interface DateFilterRange {
  start: string
  end: string
}

/** Build the canonical inclusive reporting-day predicate used by GSC queries. */
export function dateFilter(range: DateFilterRange): Filter<object> {
  return between(date, range.start, range.end)
}

/** Compose optional canonical filters while preserving a single filter's shape. */
export function andFilter(...filters: Array<Filter<unknown> | null | undefined>): Filter<unknown> {
  const active = filters.filter((filter): filter is Filter<unknown> => filter != null)
  if (active.length === 1)
    return active[0]!
  return and(...active)
}

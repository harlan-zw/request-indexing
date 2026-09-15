// Pure projections over a daily metric series. No Vue and no fetch, so the
// shapes a sparkline draws are provable without a browser.

/** Inclusive `YYYY-MM-DD` day axis from `start` to `end`. */
export function sparklineDateAxis(start: string, end: string): string[] {
  const DAY = 86_400_000
  const endMs = Date.parse(`${end}T00:00:00Z`)
  const out: string[] = []
  for (let t = Date.parse(`${start}T00:00:00Z`); t <= endMs; t += DAY)
    out.push(new Date(t).toISOString().slice(0, 10))
  return out
}

export interface ProjectedPositionSeries {
  values: number[]
  dates: string[]
}

/**
 * Project a position series onto the days it was actually measured.
 *
 * Zero-filling is right for clicks and wrong for position. A day with no
 * impressions has no rank at all, and plotting it as 0 draws a dive to the
 * chart floor that reads as the best possible ranking. So unobserved days carry
 * the last observed rank forward, and the run before the first observation is
 * dropped along with its slice of the date axis.
 *
 * Returns `null` when fewer than two days survive: one point is not a line.
 */
export function projectPositionSeries(series: readonly number[], axis: readonly string[]): ProjectedPositionSeries | null {
  const values: number[] = []
  const dates: string[] = []
  let last = 0
  for (let i = 0; i < series.length; i++) {
    const v = series[i] ?? 0
    if (v > 0)
      last = v
    else if (last === 0)
      continue
    values.push(last)
    dates.push(axis[i] ?? '')
  }
  return values.length > 1 ? { values, dates } : null
}

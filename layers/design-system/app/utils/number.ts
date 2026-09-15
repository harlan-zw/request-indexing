/**
 * Calculate percentage change between two values, clamped to ±999.
 * Returns 0 if prev is 0 (avoids division by zero).
 */
export function percentChange(current: number, prev: number): number {
  if (!prev)
    return 0
  return clamp(Math.round(((current - prev) / prev) * 100), -999, 999) || 0
}

/**
 * Percentage delta between current and previous, suitable for trend cells.
 * `inverted` flips the sign so a decrease reads as a positive change
 * (e.g. average ranking position, where lower is better).
 */
export function calcTrendPercent(current: number, previous: number, inverted = false): number {
  const pct = percentChange(current, previous)
  return inverted ? -pct : pct
}

/**
 * Metric keys whose value is a percentage and must always carry a `%` suffix.
 * CTR used to render as the raw ratio `0.074` on stat cards and as `3.6%` in
 * table cells; routing both through here keeps one unit per metric.
 */
const percentMetricKeys = new Set(['ctr', 'indexedPercent'])

export function isPercentMetric(key: string): boolean {
  return percentMetricKeys.has(key)
}

/**
 * Render a percentage-scaled value, e.g. `3.62` becomes `3.6%`.
 *
 * The input must already be scaled to 0-100. This never guesses the scale,
 * because a 0.4 could be either a 40% ratio or an already-scaled 0.4%.
 */
export function formatPercentMetric(value: number | string, decimals = 1): string {
  const num = Number(value)
  if (!Number.isFinite(num))
    return '—'
  return `${num.toFixed(decimals)}%`
}

/**
 * Display label for a metric key. Acronyms keep their casing.
 */
export function metricLabel(key: string): string {
  const labels: Record<string, string> = {
    ctr: 'CTR',
    impressions: 'Impressions',
    clicks: 'Clicks',
    position: 'Position',
    keywords: 'Keywords',
    pages: 'Pages',
    indexedPercent: 'Indexed',
  }
  return labels[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase())
}

/**
 * Clamp a number between min and max values:
 *
 * @example clamp(-5, 1, 5) // 1
 * @example clamp(10, 1, 5) // 5
 *
 * Or clamp an index to valid array indices:
 *
 * @example clamp(-5, [1, 2, 3, 4, 5]) // 0
 * @example clamp(10, [1, 2, 3, 4, 5]) // 4
 */
export function clamp(value: number, arr: readonly unknown[]): number
export function clamp(value: number, min: number, max: number): number
export function clamp(value: number, a: number | readonly unknown[], b?: number): number {
  const min = typeof a === 'number' ? a : 0
  const max = typeof a === 'number' ? b ?? min : a.length - 1
  return Math.min(Math.max(value, min), max)
}

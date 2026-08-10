// Isomorphic period helpers shared by server Site Signals and client Site Views.
// Keep this file pure — no Nitro, no $fetch, no DOM. Server-only logic
// (PST resolution, GSC latency offset) stays in server/internal/site-signals/period.ts.

export type RollingLabel = '7d' | '28d' | '90d'

export const rollingLabels = ['7d', '28d', '90d'] as const satisfies readonly RollingLabel[]

export function rollingDays(label: RollingLabel): number {
  return label === '7d' ? 7 : label === '90d' ? 90 : 28
}

/** Human label for the period window, e.g. "over the last 28d". */
export function summarizePeriod(label: RollingLabel): string {
  return `over the last ${rollingDays(label)}d`
}

/** Human label for the comparison window, e.g. "vs prior 28d". */
export function summarizeDeltaWindow(label: RollingLabel): string {
  return `vs prior ${rollingDays(label)}d`
}

/** Human label for an empty window, e.g. "in the last 28d". */
export function summarizeEmptyPeriod(label: RollingLabel): string {
  return `in the last ${rollingDays(label)}d`
}

/**
 * Pure trend percentage between two values.
 * For metrics where lower is better (e.g. position), pass `invert: true`.
 * Returns 0 when prev is 0/null/undefined to avoid Infinity.
 */
export function calcTrendPercent(current: number, prev: number, invert = false): number {
  if (!prev)
    return 0
  const pct = Math.round(((current - prev) / prev) * 100) || 0
  return (invert ? -pct : pct) || 0
}

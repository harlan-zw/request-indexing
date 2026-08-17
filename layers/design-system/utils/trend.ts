/**
 * One source of truth for how a metric delta is drawn.
 *
 * The arrow glyph, the +/- sign and the colour used to be decided in three
 * different places, so an inverted metric (search position, where a lower
 * number is better) could render `Position 12 ↘ +19%` in red: the arrow said
 * "down", the sign said "up", and the colour said "worse".
 *
 * Everything below is derived from a single number, `delta`, which is always
 * "how much better did this metric get". Disagreement is therefore not
 * representable.
 */

import { percentChange } from './number'

export type TrendDirection = 'up' | 'down' | 'flat'
export type TrendTone = 'positive' | 'negative' | 'neutral'
export type TrendSign = '+' | '-' | ''

export interface Trend {
  /** Raw percentage change from the previous value. Negative when the number fell. */
  change: number
  /** `change` re-signed so a positive number always means the metric improved. */
  delta: number
  direction: TrendDirection
  sign: TrendSign
  tone: TrendTone
}

/**
 * Build a Trend from an already-computed percentage change.
 *
 * @param change   percentage change from the previous period, e.g. `19` for +19%
 * @param inverted `true` when a lower number is better (search position, LCP)
 */
export function resolveTrendDelta(change: number, inverted = false): Trend {
  const safeChange = Number.isFinite(change) ? change : 0
  // `|| 0` normalises the -0 that negating a zero change produces.
  const delta = (inverted ? -safeChange : safeChange) || 0
  const direction: TrendDirection = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
  return {
    change: safeChange,
    delta,
    direction,
    sign: direction === 'up' ? '+' : direction === 'down' ? '-' : '',
    tone: direction === 'up' ? 'positive' : direction === 'down' ? 'negative' : 'neutral',
  }
}

/**
 * Build a Trend from a metric value and its previous-period value.
 *
 * @param value     current period value
 * @param prevValue previous period value
 * @param inverted  `true` when a lower number is better (search position, LCP)
 */
export function resolveTrend(value: number, prevValue: number, inverted = false): Trend {
  return resolveTrendDelta(percentChange(value, prevValue), inverted)
}

/**
 * Delta text for a Trend, e.g. `+19%`, `-38`, `0%`.
 * The sign always matches the direction and the tone.
 */
export function formatTrendDelta(trend: Trend, format: 'percent' | 'number' = 'percent'): string {
  const magnitude = Math.abs(trend.delta)
  return format === 'percent' ? `${trend.sign}${magnitude}%` : `${trend.sign}${magnitude}`
}

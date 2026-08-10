// Period algebra for the gscdump client path. Extracted from useProGscdump to give
// the period concept its own seam — useProGscdump now wraps API/credentials concerns
// only, this file owns "what does '28d' mean against the GSC latency window".
//
// Server-side period algebra lives in `pro-saas/server/internal/site-signals/period.ts`
// and operates on the typed `Period` discriminated union. The two are intentionally
// distinct: this client surface speaks gscdump engine preset strings, the server
// surface speaks Site-Signal periods. The isomorphic constants/labels they share
// (RollingLabel, summarize* helpers, calcTrendPercent) live in
// `pro-saas/shared/period.ts` and are imported by both.

import type { WindowPreset } from '@gscdump/engine/period'
import { resolveWindow } from '@gscdump/engine/period'
import { currentPstDate } from '@gscdump/sdk/query'
import {
  startOfWeek as dfnsStartOfWeek,
  endOfMonth,
  format,
  startOfMonth,
  startOfQuarter,
  subDays,
  subMonths,
} from 'date-fns'

/** Google Search Console's normal reporting finalization delay. */
export const GSC_STABLE_LATENCY_DAYS = 3

export type RollingPeriod = '7d' | '28d' | '3m' | '6m' | '12m'
export type CalendarPeriod = 'this-week' | 'this-month' | 'last-month' | 'this-quarter' | 'this-year'
/**
 * Custom date range from drag-to-zoom.
 *  - `custom:CS:CE` — current range only; prev range resolved by compareMode.
 *  - `custom:CS:CE:PS:PE` — explicit prev range (overrides compareMode-based prev and year).
 */
export type CustomPeriod = `custom:${string}:${string}` | `custom:${string}:${string}:${string}:${string}`
export type Period = RollingPeriod | CalendarPeriod | CustomPeriod
export type CompareMode = 'previous' | 'year' | 'none'

export interface DateRangeResult {
  start: string
  end: string
  prevStart: string
  prevEnd: string
  yearStart: string
  yearEnd: string
  days: number
}

export function isCustomPeriod(p: Period | string): p is CustomPeriod {
  return typeof p === 'string' && p.startsWith('custom:')
}

export function parseCustomPeriod(p: Period | string): { start: string, end: string, prevStart?: string, prevEnd?: string } | null {
  if (!isCustomPeriod(p))
    return null
  const parts = p.split(':')
  const [, start, end, prevStart, prevEnd] = parts
  if (!start || !end)
    return null
  if (prevStart && prevEnd)
    return { start, end, prevStart, prevEnd }
  return { start, end }
}

/** Get "today" as a Date anchored to the PST YYYY-MM-DD string from gscdump. */
function todayInPST(): Date {
  return new Date(`${currentPstDate()}T00:00:00`)
}

const ROLLING_TO_UPSTREAM: Record<string, WindowPreset> = {
  '7d': 'last-7d',
  '28d': 'last-28d',
  '3m': 'last-90d',
  '6m': 'last-180d',
  '12m': 'last-365d',
}

const CALENDAR_TO_UPSTREAM: Record<string, WindowPreset> = {
  'this-month': 'mtd',
  'this-year': 'ytd',
}

function fmt(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Pair `{ start, end }` ISO strings with both prev-period and YoY comparisons. */
function buildResultFromIso(start: string, end: string): DateRangeResult {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1
  const prev = resolveWindow({ preset: 'custom', start, end, comparison: 'prev-period' })
  const yoy = resolveWindow({ preset: 'custom', start, end, comparison: 'yoy' })
  return {
    start,
    end,
    prevStart: prev.comparison!.start,
    prevEnd: prev.comparison!.end,
    yearStart: yoy.comparison!.start,
    yearEnd: yoy.comparison!.end,
    days,
  }
}

/**
 * Compute explicit date ranges for a period, using PST boundaries for GSC data consistency.
 * When `stableData` is true (default), the end date is offset by 3 days to avoid incomplete data.
 * When false, data extends to today — recent days may have partial/incomplete metrics.
 */
export function periodToDateRange(period: Period | string, stableData = true): DateRangeResult {
  const custom = parseCustomPeriod(period)
  if (custom) {
    const result = buildResultFromIso(custom.start, custom.end)
    if (custom.prevStart && custom.prevEnd) {
      return {
        ...result,
        prevStart: custom.prevStart,
        prevEnd: custom.prevEnd,
        yearStart: custom.prevStart,
        yearEnd: custom.prevEnd,
      }
    }
    return result
  }

  const today = todayInPST()
  const end = stableData ? subDays(today, GSC_STABLE_LATENCY_DAYS) : subDays(today, 1)
  const endIso = fmt(end)

  const upstreamPreset = ROLLING_TO_UPSTREAM[period] ?? CALENDAR_TO_UPSTREAM[period]
  if (upstreamPreset) {
    const win = resolveWindow({ preset: upstreamPreset, anchor: endIso })
    return buildResultFromIso(win.start, win.end)
  }

  let start: Date
  switch (period) {
    case 'this-week':
      start = dfnsStartOfWeek(end, { weekStartsOn: 1 })
      break
    case 'last-month': {
      const prevMonth = subMonths(end, 1)
      return buildResultFromIso(fmt(startOfMonth(prevMonth)), fmt(endOfMonth(prevMonth)))
    }
    case 'this-quarter':
      start = startOfQuarter(end)
      break
    default:
      start = subDays(end, 27)
  }

  return buildResultFromIso(fmt(start), endIso)
}

export function periodToDays(period: Period | string): number {
  return periodToDateRange(period).days
}

/**
 * Pick the comparison window from a DateRangeResult given a CompareMode.
 * Returns null when the mode disables comparison.
 */
export function compareRange(
  range: DateRangeResult,
  mode: CompareMode,
): { start: string, end: string } | null {
  if (mode === 'none')
    return null
  if (mode === 'year')
    return { start: range.yearStart, end: range.yearEnd }
  return { start: range.prevStart, end: range.prevEnd }
}

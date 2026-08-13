import type { UserSelect } from '~~/layers/core/server/db/schema'
import { differenceInDays, format, subDays, subYears } from 'date-fns'

type UserPeriod = string | { start: string, end: string }

function parseUserPeriod(analyticsRange: unknown, analyticsPeriod: string | null): UserPeriod {
  if (typeof analyticsRange === 'string')
    return analyticsRange
  if (analyticsRange && typeof analyticsRange === 'object') {
    const range = analyticsRange as Record<string, unknown>
    if (typeof range.start === 'string' && typeof range.end === 'string')
      return { start: range.start, end: range.end }
  }
  return analyticsPeriod ?? '30d'
}

export function userPeriodRange(user: UserSelect) {
  const periodRange = parseUserPeriod(user.analyticsRange, user.analyticsPeriod)
  let startPeriod: Date
  let endPeriod: Date
  let startPrevPeriod: Date
  let endPrevPeriod: Date
  if (typeof periodRange === 'string') {
    endPeriod = new Date()
    if (periodRange === 'all') {
      // 100 years ago
      startPeriod = subYears(new Date(), 100)
      startPrevPeriod = subYears(new Date(), 200)
      endPrevPeriod = subYears(new Date(), 100)
    }
    else {
      const periodDays = periodRange.includes('d')
        ? Number.parseInt(periodRange.replace('d', ''))
        : (Number.parseInt(periodRange.replace('mo', '')) * 30)
      startPeriod = subDays(endPeriod, periodDays)
      startPrevPeriod = subDays(endPeriod, periodDays * 2)
      endPrevPeriod = subDays(endPeriod, periodDays + 1)
    }
  }
  else {
    startPeriod = new Date(periodRange.start)
    endPeriod = new Date(periodRange.end)
    const dayDiff = differenceInDays(endPeriod, startPeriod)
    // sub the days of the current period to generate prev period
    startPrevPeriod = subDays(new Date(periodRange.start), dayDiff)
    endPrevPeriod = subDays(new Date(periodRange.end), dayDiff)
  }
  return {
    period: {
      startTimestamp: startPeriod.valueOf(),
      start: startPeriod,
      startDateTime: format(startPeriod, 'yyyy-MM-dd HH:mm:ss'),
      startDate: format(startPeriod, 'yyyy-MM-dd'),
      end: endPeriod,
      endDate: format(endPeriod, 'yyyy-MM-dd'),
      endTimestamp: endPeriod.valueOf(),
      endDateTime: format(endPeriod, 'yyyy-MM-dd HH:mm:ss'),
    },
    prevPeriod: {
      start: startPrevPeriod,
      startDate: format(startPrevPeriod, 'yyyy-MM-dd'),
      end: endPrevPeriod,
      endDate: format(endPrevPeriod, 'yyyy-MM-dd'),
    },
  }
}

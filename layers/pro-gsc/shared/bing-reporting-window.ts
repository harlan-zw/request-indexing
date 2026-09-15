/**
 * Bing reports one row per provider date and caps a daily dataset request at
 * 366 dates, so the window is a fixed year back from today rather than the
 * shared Search Console period. Ported from nuxtseo.com
 * `layers/pro/gsc/shared/bing-search-data.ts`.
 */
export const BING_REPORTING_WINDOW_DAYS = 366

export interface BingReportingWindow {
  startDate: string
  endDate: string
}

export function bingReportingWindow(now: Date): BingReportingWindow {
  const endDate = now.toISOString().slice(0, 10)
  const start = new Date(`${endDate}T00:00:00Z`)
  start.setUTCDate(start.getUTCDate() - (BING_REPORTING_WINDOW_DAYS - 1))
  return { startDate: start.toISOString().slice(0, 10), endDate }
}

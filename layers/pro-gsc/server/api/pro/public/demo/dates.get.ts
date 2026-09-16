import type { GscDemoDatesResponse } from '#layers/pro-gsc/shared/contracts/demo'
import { createError, defineEventHandler, getQuery } from 'h3'
import { clampDemoPeriod, gscDemoDatesQuerySchema } from '#layers/pro-gsc/shared/contracts/demo'
import { buildDemoSeries } from '#layers/pro-gsc/shared/demo-search-data'

// Public demo time series. The dashboard shows it behind the sample data card
// when a Site has no Search Console connection. The handler reads no session
// and no database, so it exposes no customer data. The figures are generated
// from the date. See `shared/demo-search-data.ts`.
export default defineEventHandler((event): GscDemoDatesResponse => {
  const parsed = gscDemoDatesQuerySchema.safeParse(getQuery(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, message: 'Invalid demo query.' })

  // The period is clamped to a fixed allowlist. An anonymous caller cannot ask
  // for an arbitrary range.
  const period = clampDemoPeriod(parsed.data.period)
  const series = buildDemoSeries(period, new Date())

  return {
    dates: series.dates,
    prevDates: series.prevDates,
    period: series.period,
    prevPeriod: series.prevPeriod,
    hasPrevData: true,
  }
})

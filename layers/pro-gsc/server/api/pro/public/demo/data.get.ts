import type { GscDemoDataResponse } from '#layers/pro-gsc/shared/contracts/demo'
import { createError, defineEventHandler, getQuery } from 'h3'
import { clampDemoPeriod, gscDemoDataQuerySchema } from '#layers/pro-gsc/shared/contracts/demo'
import { buildDemoData } from '#layers/pro-gsc/shared/demo-search-data'

// Public demo breakdown rows, one dimension per request. The dashboard shows
// them behind the sample data card when a Site has no Search Console
// connection. The handler reads no session and no database, so it exposes no
// customer data. See `shared/demo-search-data.ts`.
export default defineEventHandler((event): GscDemoDataResponse => {
  const parsed = gscDemoDataQuerySchema.safeParse(getQuery(event))
  if (!parsed.success)
    throw createError({ statusCode: 400, message: 'Invalid demo query.' })

  const { dimension, limit, sort, sortDir } = parsed.data
  // The period is clamped to a fixed allowlist. An anonymous caller cannot ask
  // for an arbitrary range.
  const period = clampDemoPeriod(parsed.data.period)
  const data = buildDemoData({ dimension, period, limit, sort, sortDir }, new Date())

  return {
    rows: data.rows,
    totals: data.totals,
    totalCount: data.totalCount,
    hasPrevData: true,
  }
})

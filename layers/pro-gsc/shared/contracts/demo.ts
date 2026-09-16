import { z } from 'zod'

// The public demo endpoints are unauthenticated. The dashboard forwards any GSC
// period, including `custom:` ranges, so the query type stays permissive. Each
// handler clamps the period to this allowlist before it does any work. The
// allowlist stops an anonymous caller from enumerating unbounded periods.
// `clampDemoPeriod` maps anything outside the allowlist to the default. That
// matches `periodToDays`, which already treats an unknown period as 28 days.
export const GSC_DEMO_PERIODS = [
  '7d',
  '28d',
  '3m',
  '6m',
  '12m',
  'this-week',
  'this-month',
  'last-month',
  'this-quarter',
  'this-year',
] as const

export type GscDemoPeriod = typeof GSC_DEMO_PERIODS[number]

export function clampDemoPeriod(period: string | undefined): GscDemoPeriod {
  return (GSC_DEMO_PERIODS as readonly string[]).includes(period ?? '') ? period as GscDemoPeriod : '28d'
}

export const gscDemoPeriodSchema = z.string().min(1)

export const gscDemoDatesQuerySchema = z.object({
  period: gscDemoPeriodSchema.default('28d'),
})
export type GscDemoDatesQuery = z.input<typeof gscDemoDatesQuerySchema>

export const GSC_DEMO_DIMENSIONS = ['queryCanonical', 'page', 'country', 'device'] as const
export type GscDemoDimension = typeof GSC_DEMO_DIMENSIONS[number]

export const GSC_DEMO_METRICS = ['clicks', 'impressions', 'ctr', 'position'] as const
export type GscDemoMetric = typeof GSC_DEMO_METRICS[number]

export const gscDemoDataQuerySchema = z.object({
  dimension: z.enum(GSC_DEMO_DIMENSIONS).default('queryCanonical'),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  period: gscDemoPeriodSchema.default('28d'),
  sort: z.enum(GSC_DEMO_METRICS).default('clicks'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
})
export type GscDemoDataQuery = z.input<typeof gscDemoDataQuerySchema>

const gscMetricTotalsSchema = z.object({
  clicks: z.number(),
  impressions: z.number(),
  position: z.number(),
  ctr: z.number(),
})
export type GscDemoTotals = z.infer<typeof gscMetricTotalsSchema>

export const gscDemoDateRowSchema = gscMetricTotalsSchema.extend({
  date: z.string(),
})
export type GscDemoDateRow = z.infer<typeof gscDemoDateRowSchema>

export const gscDemoDatesResponseSchema = z.object({
  dates: z.array(gscDemoDateRowSchema),
  prevDates: z.array(gscDemoDateRowSchema).nullable(),
  period: gscMetricTotalsSchema,
  prevPeriod: gscMetricTotalsSchema.nullable(),
  hasPrevData: z.boolean(),
})
export type GscDemoDatesResponse = z.infer<typeof gscDemoDatesResponseSchema>

export const gscDemoDataRowSchema = gscMetricTotalsSchema.extend({
  country: z.string().optional(),
  device: z.string().optional(),
  keyword: z.string().optional(),
  page: z.string().optional(),
  prevClicks: z.number().optional(),
  prevCtr: z.number().optional(),
  prevImpressions: z.number().optional(),
  prevPosition: z.number().optional(),
})
export type GscDemoDataRow = z.infer<typeof gscDemoDataRowSchema>

export const gscDemoDataResponseSchema = z.object({
  rows: z.array(gscDemoDataRowSchema),
  totals: gscMetricTotalsSchema,
  totalCount: z.number(),
  hasPrevData: z.boolean(),
})
export type GscDemoDataResponse = z.infer<typeof gscDemoDataResponseSchema>

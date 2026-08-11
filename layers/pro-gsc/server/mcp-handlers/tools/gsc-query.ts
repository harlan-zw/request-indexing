import type { GscdumpDataRow } from '@gscdump/contracts'
import type { BuilderState, Dimension, Filter, Metric } from 'gscdump/query'
import type { GscComparisonFilter } from '#layers/pro-saas/server/utils/mcp/gsc'
import { z } from 'zod'
import { defineMcpGscSiteTool } from '#layers/pro-saas/server/utils/mcp/frame'
import {
  and,
  buildDataQuery,
  buildDateFilter,
  buildDateRange,
  clicks,
  ctr,
  eq,
  filterSchema,
  gte,
  impressions,
  limitSchema,
  lte,
  page,
  pageSchema,
  periodSchema,
  position,
  query,
  searchSchema,
  siteUrlSchema,
  sortDirSchema,
  sortSchema,
} from '#layers/pro-saas/server/utils/mcp/gsc'

const queryTypeSchema = z.enum([
  'pages',
  'keywords',
  'countries',
  'devices',
  'timeseries',
  'page-detail',
  'keyword-detail',
  'analysis',
]).describe('Query type: pages, keywords, countries, devices (breakdown), timeseries (daily trend), page-detail (keywords for a URL), keyword-detail (pages for a keyword), analysis (SEO presets like striking-distance, opportunity, movers-rising, movers-declining, decay, zero-click, non-brand, brand-only)')

const analysisPresetSchema = z.enum([
  'striking-distance',
  'opportunity',
  'movers-rising',
  'movers-declining',
  'decay',
  'zero-click',
  'non-brand',
  'brand-only',
]).optional().describe('Analysis preset (required when type=analysis)')

const gscQueryInputSchema = {
  type: queryTypeSchema,
  siteUrl: siteUrlSchema,
  period: periodSchema,
  limit: limitSchema,
  page: pageSchema,
  search: searchSchema,
  sort: sortSchema.optional(),
  sortDir: sortDirSchema,
  filter: filterSchema,
  pageUrl: z.string().url().optional().describe('Page URL (required for page-detail type)'),
  keyword: z.string().optional().describe('Keyword (required for keyword-detail type)'),
  preset: analysisPresetSchema,
  brandTerms: z.string().optional().describe('Brand terms, comma-separated (required for non-brand/brand-only presets)'),
  minClicks: z.number().optional().describe('Minimum clicks'),
  maxClicks: z.number().optional().describe('Maximum clicks'),
  minImpressions: z.number().optional().describe('Minimum impressions'),
  maxImpressions: z.number().optional().describe('Maximum impressions'),
  minPosition: z.number().optional().describe('Minimum position'),
  maxPosition: z.number().optional().describe('Maximum position'),
  maxCtr: z.number().optional().describe('Maximum CTR (useful for opportunity analysis)'),
}

type GscQueryInput = {
  [K in keyof typeof gscQueryInputSchema]: z.output<(typeof gscQueryInputSchema)[K]>
}

export default defineMcpGscSiteTool({
  name: 'gsc_query',
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  description: `Query Google Search Console data. Single endpoint for all GSC queries.

Types:
- pages: Top pages by clicks/impressions
- keywords: Top keywords/queries
- countries: Traffic by country
- devices: Traffic by device
- timeseries: Daily clicks/impressions trend
- page-detail: Keywords ranking for a specific URL (requires pageUrl)
- keyword-detail: Pages ranking for a specific keyword (requires keyword)
- analysis: SEO presets (requires preset). Presets: striking-distance, opportunity, movers-rising, movers-declining, decay, zero-click, non-brand, brand-only`,
  inputSchema: gscQueryInputSchema,
  inputExamples: [
    { type: 'pages', period: '28d', limit: 10 },
    { type: 'keywords', period: '3m', sort: 'impressions', limit: 25 },
    { type: 'page-detail', pageUrl: 'https://example.com/blog/post', period: '28d' },
    { type: 'keyword-detail', keyword: 'nuxt seo', period: '28d' },
    { type: 'analysis', preset: 'striking-distance', period: '28d' },
    { type: 'analysis', preset: 'non-brand', brandTerms: 'nuxt,nuxtseo', period: '3m' },
  ],
  cache: '1hr',
  resolveSiteUrl: input => input.siteUrl || (input.pageUrl ? new URL(input.pageUrl).origin : undefined),
  async handler(input, { site }) {
    const gscdump = useGscdumpClient()

    // Route to the right handler based on type
    switch (input.type) {
      case 'timeseries':
        return handleTimeseries(gscdump, site, input)
      case 'analysis':
        return handleAnalysis(gscdump, site, input)
      case 'page-detail':
        return handlePageDetail(gscdump, site, input)
      case 'keyword-detail':
        return handleKeywordDetail(gscdump, site, input)
      default:
        return handleDataQuery(gscdump, site, input)
    }
  },
})

// Dimension query: pages, keywords, countries, devices
function handleDataQuery(gscdump: ReturnType<typeof useGscdumpClient>, site: { gscdumpSiteId: string, url: string }, input: GscQueryInput) {
  const dimensionMap: Partial<Record<GscQueryInput['type'], { dimension: Dimension, searchColumn?: Dimension }>> = {
    pages: { dimension: 'page', searchColumn: 'page' },
    keywords: { dimension: 'query', searchColumn: 'query' },
    countries: { dimension: 'country' },
    devices: { dimension: 'device' },
  }

  const config = dimensionMap[input.type]
  if (!config)
    return errorResult(`Unknown query type: ${input.type}`)
  const offset = ((input.page || 1) - 1) * (input.limit || 25)
  const extraFilters = buildMetricFilters(input)

  const { state, comparison } = buildDataQuery({
    dimensions: [config.dimension],
    period: input.period,
    limit: input.limit,
    offset,
    sort: (input.sort || 'clicks') as Metric,
    sortDir: input.sortDir,
    search: input.search,
    searchColumn: config.searchColumn,
    extraFilters,
  })

  return gscdump.getData(site.gscdumpSiteId, state, {
    comparison,
    filter: input.filter as GscComparisonFilter | undefined,
  }).then(result => jsonResult({
    site: site.url,
    type: input.type,
    period: input.period,
    total: result.totalCount,
    totals: result.totals || null,
    rows: result.rows.map(r => formatRow(r, input.type)),
  }))
}

// Daily time-series
function handleTimeseries(gscdump: ReturnType<typeof useGscdumpClient>, site: { gscdumpSiteId: string, url: string }, input: GscQueryInput) {
  const { current, previous } = buildDateFilter(input.period)

  return gscdump.getDataDetail(
    site.gscdumpSiteId,
    { dimensions: ['date'], filter: current },
    { comparison: { dimensions: ['date'], filter: previous } },
  ).then(result => jsonResult({
    site: site.url,
    type: 'timeseries',
    period: input.period,
    totals: result.totals || null,
    prevTotals: result.previousTotals || null,
    daily: result.daily.map(d => ({
      date: d.date,
      clicks: d.clicks,
      impressions: d.impressions,
      ctr: d.ctr,
      pos: d.position,
    })),
  }))
}

// Analysis presets
function handleAnalysis(gscdump: ReturnType<typeof useGscdumpClient>, site: { gscdumpSiteId: string, url: string }, input: GscQueryInput) {
  if (!input.preset)
    return errorResult('preset is required for type=analysis')
  if ((input.preset === 'non-brand' || input.preset === 'brand-only') && !input.brandTerms?.trim())
    return errorResult('brandTerms is required for non-brand/brand-only presets')

  const dates = buildDateRange(input.period)
  const offset = ((input.page || 1) - 1) * (input.limit || 25)

  return gscdump.getAnalysis(site.gscdumpSiteId, {
    preset: input.preset,
    ...dates,
    brandTerms: input.brandTerms,
    limit: input.limit,
    offset,
    search: input.search,
    minImpressions: input.minImpressions,
    minPosition: input.minPosition,
    maxPosition: input.maxPosition,
    maxCtr: input.maxCtr,
  }).then(result => jsonResult({
    site: site.url,
    type: 'analysis',
    preset: result.preset,
    description: result.meta?.presetDescription,
    period: input.period,
    total: result.totalCount,
    summary: result.summary || null,
    rows: result.keywords.map(k => ({
      keyword: k.keyword,
      clicks: k.clicks,
      impressions: k.impressions,
      ctr: k.ctr,
      pos: k.position,
      page: k.page || k.topPage,
      prevClicks: k.prevClicks,
      prevPos: k.prevPosition,
      potentialClicks: k.potentialClicks,
      opportunityScore: k.opportunityScore,
      clicksChange: k.clicksChange,
      posChange: k.positionChange,
      decayPct: k.decayPercent,
      missedClicks: k.missedClicks,
    })),
  }))
}

// Page detail: keywords for a specific URL
function handlePageDetail(gscdump: ReturnType<typeof useGscdumpClient>, site: { gscdumpSiteId: string, url: string }, input: GscQueryInput) {
  if (!input.pageUrl)
    return errorResult('pageUrl is required for type=page-detail')

  const { current, previous } = buildDateFilter(input.period)

  const state: BuilderState = {
    dimensions: ['page', 'query'],
    filter: and(current, eq(page, input.pageUrl)),
    orderBy: { column: 'clicks', dir: 'desc' },
    rowLimit: input.limit,
  }
  const comparison: BuilderState = {
    dimensions: ['page', 'query'],
    filter: and(previous, eq(page, input.pageUrl)),
  }

  return gscdump.getData(site.gscdumpSiteId, state, { comparison })
    .then(result => jsonResult({
      site: site.url,
      type: 'page-detail',
      pageUrl: input.pageUrl,
      period: input.period,
      totals: result.totals || null,
      rows: result.rows.map(k => ({
        keyword: k.query,
        clicks: k.clicks,
        impressions: k.impressions,
        ctr: k.ctr,
        pos: k.position,
        prevClicks: k.prevClicks,
        prevPos: k.prevPosition,
      })),
    }))
}

// Keyword detail: pages for a specific keyword
function handleKeywordDetail(gscdump: ReturnType<typeof useGscdumpClient>, site: { gscdumpSiteId: string, url: string }, input: GscQueryInput) {
  if (!input.keyword)
    return errorResult('keyword is required for type=keyword-detail')

  const { current, previous } = buildDateFilter(input.period)

  const state: BuilderState = {
    dimensions: ['query', 'page'],
    filter: and(current, eq(query, input.keyword)),
    orderBy: { column: 'clicks', dir: 'desc' },
    rowLimit: input.limit,
  }
  const comparison: BuilderState = {
    dimensions: ['query', 'page'],
    filter: and(previous, eq(query, input.keyword)),
  }

  return gscdump.getData(site.gscdumpSiteId, state, { comparison })
    .then(result => jsonResult({
      site: site.url,
      type: 'keyword-detail',
      keyword: input.keyword,
      period: input.period,
      totals: result.totals || null,
      rows: result.rows.map(p => ({
        page: p.page,
        clicks: p.clicks,
        impressions: p.impressions,
        ctr: p.ctr,
        pos: p.position,
        prevClicks: p.prevClicks,
        prevPos: p.prevPosition,
      })),
    }))
}

// Build metric filters from input
function buildMetricFilters(input: GscQueryInput): Filter<object>[] {
  const filters: Filter<object>[] = []
  if (input.minClicks != null)
    filters.push(gte(clicks, input.minClicks))
  if (input.maxClicks != null)
    filters.push(lte(clicks, input.maxClicks))
  if (input.minImpressions != null)
    filters.push(gte(impressions, input.minImpressions))
  if (input.maxImpressions != null)
    filters.push(lte(impressions, input.maxImpressions))
  if (input.minPosition != null)
    filters.push(gte(position, input.minPosition))
  if (input.maxPosition != null)
    filters.push(lte(position, input.maxPosition))
  if (input.maxCtr != null)
    filters.push(lte(ctr, input.maxCtr))
  return filters
}

// Format a data row based on query type
function formatRow(r: GscdumpDataRow, type: GscQueryInput['type']) {
  switch (type) {
    case 'pages':
      return {
        url: r.page,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        pos: r.position,
        keyword: r.topKeyword || null,
        prevClicks: r.prevClicks,
        prevPos: r.prevPosition,
        change: r.prevClicks != null ? r.clicks - r.prevClicks : null,
      }
    case 'keywords':
      return {
        keyword: r.query,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        pos: r.position,
        topPage: r.topPage || null,
        prevClicks: r.prevClicks,
        prevPos: r.prevPosition,
        change: r.prevClicks != null ? r.clicks - r.prevClicks : null,
      }
    case 'countries': {
      return {
        country: r.country,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        pos: r.position,
        prevClicks: r.prevClicks,
        change: r.prevClicks != null ? r.clicks - r.prevClicks : null,
      }
    }
    case 'devices':
      return {
        device: r.device,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        pos: r.position,
      }
    default:
      return r
  }
}

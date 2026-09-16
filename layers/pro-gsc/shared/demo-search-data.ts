import type {
  GscDemoDataRow,
  GscDemoDateRow,
  GscDemoDimension,
  GscDemoMetric,
  GscDemoPeriod,
  GscDemoTotals,
} from './contracts/demo'
import { periodToDateRange } from '@gscdump/sdk/period'

// Sample Search Console data for the public demo endpoints.
//
// The dashboard shows this behind the "Sample search data" card when a Site has
// no Search Console connection yet. nuxtseo.com reads the same shape from a
// dedicated demo property on gscdump. This repo registers no such property and
// carries no `demoSiteId` config, so the numbers are generated here instead.
// The generator is pure and seeded by the date, so a given day always returns
// the same figures. No real customer data is read.

const DEMO_QUERIES = [
  'request indexing',
  'google indexing api',
  'how to index a page on google',
  'submit url to google',
  'url inspection tool',
  'why is my page not indexed',
  'google search console api',
  'index status checker',
  'sitemap not indexed',
  'crawl budget',
  'noindex tag checker',
  'google indexing delay',
  'bulk url submission',
  'search console coverage report',
  'canonical url checker',
  'discovered currently not indexed',
  'crawled currently not indexed',
  'indexing api quota',
  'reindex a page',
  'google index checker tool',
]

const DEMO_PAGES = [
  'https://example.com/',
  'https://example.com/pricing',
  'https://example.com/docs/getting-started',
  'https://example.com/docs/indexing-api',
  'https://example.com/blog/how-google-indexes-pages',
  'https://example.com/blog/sitemap-best-practices',
  'https://example.com/tools/index-checker',
  'https://example.com/docs/search-console-setup',
  'https://example.com/blog/crawl-budget-explained',
  'https://example.com/changelog',
  'https://example.com/docs/faq',
  'https://example.com/blog/canonical-tags',
  'https://example.com/integrations',
  'https://example.com/about',
  'https://example.com/contact',
]

const DEMO_COUNTRIES = ['usa', 'gbr', 'deu', 'ind', 'aus', 'can', 'fra', 'nld', 'bra', 'jpn']

const DEMO_DEVICES = ['DESKTOP', 'MOBILE', 'TABLET']

const BASE_DAILY_IMPRESSIONS = 1450

/** Maps a seed string to a stable number between 0 and 1. FNV-1a, 32 bit. */
function hashToUnit(seed: string): number {
  let hash = 0x811C9DC5
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash / 0xFFFFFFFF
}

/** Adds whole days to a `YYYY-MM-DD` date. UTC math keeps the date stable. */
function addDaysIso(date: string, days: number): string {
  const time = Date.parse(`${date}T00:00:00Z`)
  return new Date(time + days * 86_400_000).toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string): number {
  const startTime = Date.parse(`${start}T00:00:00Z`)
  const endTime = Date.parse(`${end}T00:00:00Z`)
  return Math.round((endTime - startTime) / 86_400_000)
}

function weekdayFactor(date: string): number {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  // Search demand drops at the weekend. The chart looks wrong without it.
  return weekday === 0 || weekday === 6 ? 0.66 : 1
}

function round(value: number, places: number): number {
  const factor = 10 ** places
  return Math.round(value * factor) / factor
}

/**
 * Builds one daily row. `index` is the offset on a continuous timeline, so the
 * previous period sits before the current one and the series trends upward.
 */
function buildDateRow(date: string, index: number, span: number): GscDemoDateRow {
  const jitter = 0.85 + hashToUnit(`${date}:impressions`) * 0.3
  const trend = 1 + (index / Math.max(span, 1)) * 0.35
  const impressions = Math.max(1, Math.round(BASE_DAILY_IMPRESSIONS * weekdayFactor(date) * jitter * trend))
  const ctr = 0.028 + hashToUnit(`${date}:ctr`) * 0.026
  const clicks = Math.max(1, Math.round(impressions * ctr))
  const position = 6.5 + hashToUnit(`${date}:position`) * 5.5
  return {
    date,
    clicks,
    impressions,
    ctr: round(clicks / impressions, 4),
    position: round(position, 1),
  }
}

function buildSeries(start: string, days: number, indexOffset: number, span: number): GscDemoDateRow[] {
  return Array.from({ length: days }, (_unused, offset) =>
    buildDateRow(addDaysIso(start, offset), indexOffset + offset, span))
}

export function totalsFor(rows: GscDemoDateRow[]): GscDemoTotals {
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0)
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0)
  const weightedPosition = rows.reduce((sum, row) => sum + row.position * row.impressions, 0)
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? round(clicks / impressions, 4) : 0,
    position: impressions > 0 ? round(weightedPosition / impressions, 1) : 0,
  }
}

export interface DemoSeries {
  dates: GscDemoDateRow[]
  prevDates: GscDemoDateRow[]
  period: GscDemoTotals
  prevPeriod: GscDemoTotals
}

/**
 * Builds the demo time series for a period. `now` fixes the clock, so a caller
 * and a test both control which days the series covers.
 */
export function buildDemoSeries(period: GscDemoPeriod, now: Date): DemoSeries {
  const range = periodToDateRange(period, { stableData: true, now })
  const days = Math.max(1, daysBetween(range.start, range.end) + 1)
  const prevDays = Math.max(1, daysBetween(range.prevStart, range.prevEnd) + 1)
  const span = days + prevDays

  const prevDates = buildSeries(range.prevStart, prevDays, 0, span)
  const dates = buildSeries(range.start, days, prevDays, span)

  return {
    dates,
    prevDates,
    period: totalsFor(dates),
    prevPeriod: totalsFor(prevDates),
  }
}

function entitiesFor(dimension: GscDemoDimension): string[] {
  switch (dimension) {
    case 'page': return DEMO_PAGES
    case 'country': return DEMO_COUNTRIES
    case 'device': return DEMO_DEVICES
    case 'queryCanonical': return DEMO_QUERIES
  }
}

function dimensionKey(dimension: GscDemoDimension): 'keyword' | 'page' | 'country' | 'device' {
  return dimension === 'queryCanonical' ? 'keyword' : dimension
}

/** Share of the period totals an entity takes. Rank decay plus a stable jitter. */
function entityWeight(dimension: GscDemoDimension, entity: string, rank: number): number {
  const decay = 1 / (rank + 1.6) ** 0.95
  return decay * (0.75 + hashToUnit(`${dimension}:${entity}:weight`) * 0.5)
}

function metricOf(row: GscDemoDataRow, metric: GscDemoMetric): number {
  return row[metric]
}

export interface DemoDataQuery {
  dimension: GscDemoDimension
  period: GscDemoPeriod
  limit: number
  sort: GscDemoMetric
  sortDir: 'asc' | 'desc'
}

export interface DemoData {
  rows: GscDemoDataRow[]
  totals: GscDemoTotals
  totalCount: number
}

/**
 * Builds the demo breakdown rows for one dimension. The rows share the period
 * totals from `buildDemoSeries`, so the cards and the lists agree.
 */
export function buildDemoData(query: DemoDataQuery, now: Date): DemoData {
  const { period, prevPeriod } = buildDemoSeries(query.period, now)
  const entities = entitiesFor(query.dimension)
  const weights = entities.map((entity, rank) => entityWeight(query.dimension, entity, rank))
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0)

  const rows: GscDemoDataRow[] = entities.map((entity, rank) => {
    const share = weights[rank]! / weightTotal
    const impressions = Math.max(1, Math.round(period.impressions * share))
    const ctr = 0.02 + hashToUnit(`${query.dimension}:${entity}:ctr`) * 0.06
    const clicks = Math.max(1, Math.round(impressions * ctr))
    const position = 2.4 + hashToUnit(`${query.dimension}:${entity}:position`) * 18

    // The previous period moves each entity by its own stable factor, so some
    // rows grow and some decline.
    const drift = 0.78 + hashToUnit(`${query.dimension}:${entity}:drift`) * 0.5
    const prevShare = share * drift
    const prevImpressions = Math.max(1, Math.round(prevPeriod.impressions * prevShare))
    const prevClicks = Math.max(1, Math.round(prevImpressions * ctr * drift))

    return {
      [dimensionKey(query.dimension)]: entity,
      clicks,
      impressions,
      ctr: round(clicks / impressions, 4),
      position: round(position, 1),
      prevClicks,
      prevImpressions,
      prevCtr: round(prevClicks / prevImpressions, 4),
      prevPosition: round(position * drift, 1),
    }
  })

  const direction = query.sortDir === 'asc' ? 1 : -1
  const sorted = [...rows].sort((a, b) => (metricOf(a, query.sort) - metricOf(b, query.sort)) * direction)

  return {
    rows: sorted.slice(0, query.limit),
    totals: period,
    totalCount: entities.length,
  }
}

import { describe, expect, it } from 'vitest'
import { buildDemoData, buildDemoSeries, totalsFor } from './demo-search-data'

const NOW = new Date('2026-05-20T12:00:00Z')

describe('buildDemoSeries', () => {
  it('returns one row per day for the period and a matching previous period', () => {
    const series = buildDemoSeries('7d', NOW)

    expect(series.dates).toHaveLength(7)
    expect(series.prevDates).toHaveLength(7)
    expect(series.dates.every(row => /^\d{4}-\d{2}-\d{2}$/.test(row.date))).toBe(true)
  })

  it('returns the same numbers for the same clock', () => {
    expect(buildDemoSeries('28d', NOW)).toEqual(buildDemoSeries('28d', NOW))
  })

  it('reports period totals that agree with the daily rows', () => {
    const series = buildDemoSeries('28d', NOW)

    expect(series.period).toEqual(totalsFor(series.dates))
    expect(series.period.clicks).toBe(series.dates.reduce((sum, row) => sum + row.clicks, 0))
    expect(series.period.impressions).toBe(series.dates.reduce((sum, row) => sum + row.impressions, 0))
  })

  it('keeps every daily metric inside a believable range', () => {
    const series = buildDemoSeries('3m', NOW)

    for (const row of series.dates) {
      expect(row.clicks).toBeGreaterThan(0)
      expect(row.impressions).toBeGreaterThan(row.clicks)
      expect(row.ctr).toBeGreaterThan(0)
      expect(row.ctr).toBeLessThan(1)
      expect(row.position).toBeGreaterThan(1)
      expect(row.position).toBeLessThan(100)
    }
  })
})

describe('buildDemoData', () => {
  it('labels query rows with `keyword` and page rows with `page`', () => {
    const keywords = buildDemoData({ dimension: 'queryCanonical', period: '3m', limit: 5, sort: 'clicks', sortDir: 'desc' }, NOW)
    const pages = buildDemoData({ dimension: 'page', period: '3m', limit: 5, sort: 'clicks', sortDir: 'desc' }, NOW)

    expect(keywords.rows).toHaveLength(5)
    expect(keywords.rows.every(row => typeof row.keyword === 'string' && row.keyword.length > 0)).toBe(true)
    expect(keywords.rows.every(row => row.page === undefined)).toBe(true)

    expect(pages.rows).toHaveLength(5)
    expect(pages.rows.every(row => typeof row.page === 'string' && row.page.startsWith('https://'))).toBe(true)
  })

  it('sorts by the requested metric and direction', () => {
    const desc = buildDemoData({ dimension: 'queryCanonical', period: '28d', limit: 10, sort: 'clicks', sortDir: 'desc' }, NOW)
    const asc = buildDemoData({ dimension: 'queryCanonical', period: '28d', limit: 10, sort: 'position', sortDir: 'asc' }, NOW)

    const clicks = desc.rows.map(row => row.clicks)
    expect(clicks).toEqual([...clicks].sort((a, b) => b - a))

    const positions = asc.rows.map(row => row.position)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })

  it('counts every entity for the dimension, not only the returned page', () => {
    const result = buildDemoData({ dimension: 'device', period: '28d', limit: 2, sort: 'clicks', sortDir: 'desc' }, NOW)

    expect(result.rows).toHaveLength(2)
    expect(result.totalCount).toBe(3)
  })

  it('shares the period totals with the time series', () => {
    const result = buildDemoData({ dimension: 'page', period: '7d', limit: 5, sort: 'clicks', sortDir: 'desc' }, NOW)

    expect(result.totals).toEqual(buildDemoSeries('7d', NOW).period)
  })

  it('returns comparison metrics on every row', () => {
    const result = buildDemoData({ dimension: 'country', period: '28d', limit: 10, sort: 'impressions', sortDir: 'desc' }, NOW)

    for (const row of result.rows) {
      expect(row.prevClicks).toBeGreaterThan(0)
      expect(row.prevImpressions).toBeGreaterThan(0)
      expect(row.prevPosition).toBeGreaterThan(0)
    }
  })
})

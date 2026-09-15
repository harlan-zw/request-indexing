import { describe, expect, it } from 'vitest'
import { buildIndexCohortsFromIndexingUrls } from './index-cohorts'

function row(url: string, indexed: boolean) {
  return { url, verdict: indexed ? 'PASS' : 'NEUTRAL', sitemaps: null }
}

/** `count` URLs under one prefix, the first `notIndexed` of them refused. */
function section(prefix: string, count: number, notIndexed: number) {
  return Array.from({ length: count }, (_, index) => row(`https://example.com${prefix}/page-${index}`, index >= notIndexed))
}

describe('buildIndexCohortsFromIndexingUrls', () => {
  it('reports no evidence when the inspection set is empty', () => {
    const result = buildIndexCohortsFromIndexingUrls({ urls: [] })

    expect(result).toEqual({
      _tag: 'no-evidence',
      crawlSettingsId: null,
      asOf: null,
      reason: 'no-inspection-join',
    })
  })

  it('names the section Google refuses far more often than the rest', () => {
    const result = buildIndexCohortsFromIndexingUrls({
      urls: [
        ...section('/docs', 40, 36),
        ...section('/blog', 60, 2),
      ],
    })

    expect(result._tag).toBe('outliers')
    if (result._tag !== 'outliers')
      throw new Error('expected outliers')
    expect(result.cells[0]).toMatchObject({
      dimension: 'section',
      key: '/docs',
      pathPrefix: '/docs',
      total: 40,
      notIndexed: 36,
    })
    expect(result.baseline).toEqual({ total: 100, notIndexed: 38, rate: 0.38 })
  })

  it('reports uniform when every section fails at the same rate', () => {
    const result = buildIndexCohortsFromIndexingUrls({
      urls: [
        ...section('/docs', 40, 8),
        ...section('/blog', 40, 8),
      ],
    })

    expect(result._tag).toBe('uniform')
    if (result._tag !== 'uniform')
      throw new Error('expected uniform')
    expect(result.baseline.notIndexed).toBe(16)
    expect(result.tested).toBeGreaterThan(0)
  })

  it('counts fragment URLs as excluded rather than as not-indexed pages', () => {
    const result = buildIndexCohortsFromIndexingUrls({
      urls: [
        ...section('/docs', 20, 4),
        row('https://example.com/docs/page-0#install', false),
        row('https://example.com/docs/page-0#usage', false),
      ],
    })

    expect(result._tag).not.toBe('no-evidence')
    if (result._tag === 'no-evidence')
      throw new Error('expected a diagnosis')
    expect(result.coverage).toEqual({ analysed: 20, excludedFragments: 2, notCrawled: 0 })
  })

  it('drops rows that are not absolute http URLs and have no site to resolve against', () => {
    const result = buildIndexCohortsFromIndexingUrls({
      urls: [...section('/docs', 20, 4), row('not a url', false)],
    })

    if (result._tag === 'no-evidence')
      throw new Error('expected a diagnosis')
    expect(result.baseline.total).toBe(20)
  })

  it('resolves relative rows against a Search Console domain property', () => {
    const result = buildIndexCohortsFromIndexingUrls({
      urls: Array.from({ length: 20 }, (_, index) => row(`/docs/page-${index}`, index >= 4)),
      siteUrl: 'sc-domain:example.com',
    })

    if (result._tag === 'no-evidence')
      throw new Error('expected a diagnosis')
    expect(result.baseline).toEqual({ total: 20, notIndexed: 4, rate: 0.2 })
  })

  it('carries the caller snapshot timestamp onto the wire', () => {
    const result = buildIndexCohortsFromIndexingUrls(
      { urls: section('/docs', 20, 4) },
      '2026-09-15T00:00:00.000Z',
    )

    expect(result.asOf).toBe('2026-09-15T00:00:00.000Z')
    expect(result.crawlSettingsId).toBeNull()
  })
})

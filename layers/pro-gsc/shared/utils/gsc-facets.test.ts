import { describe, expect, it } from 'vitest'
import { breakdownWindow, facetsToFilters, facetToFilter, hasCurrentWindowTraffic, hasMoreRows, isMoversFilter } from './gsc-facets'

describe('facetToFilter', () => {
  it('compiles an equality facet against its own column', () => {
    expect(facetToFilter({ column: 'country', op: 'eq', value: 'usa' })).toMatchObject({
      _filters: [{ dimension: 'country', operator: 'equals', expression: 'usa' }],
    })
  })

  it('compiles a negated regex facet on the canonical query', () => {
    expect(facetToFilter({ column: 'queryCanonical', op: 'notRegex', value: '^(how|what)\\b' })).toMatchObject({
      _filters: [{ dimension: 'queryCanonical', operator: 'excludingRegex', expression: '^(how|what)\\b' }],
    })
  })

  it('drops an empty value rather than matching nothing', () => {
    expect(facetToFilter({ column: 'device', op: 'eq', value: '' })).toBeNull()
  })

  it('keeps only the facets that carry a value', () => {
    const filters = facetsToFilters([
      { column: 'country', op: 'eq', value: 'aus' },
      { column: 'device', op: 'eq', value: '' },
    ])
    expect(filters).toHaveLength(1)
  })
})

describe('breakdownWindow', () => {
  it('walks a fixed window with an offset when paged', () => {
    expect(breakdownWindow({ loadMore: false, page: 3, pageSize: 25 })).toEqual({ limit: 25, offset: 50 })
  })

  it('grows the limit from row zero when loading more', () => {
    expect(breakdownWindow({ loadMore: true, page: 3, pageSize: 25 })).toEqual({ limit: 75, offset: 0 })
  })

  it('treats page zero as the first page', () => {
    expect(breakdownWindow({ loadMore: false, page: 0, pageSize: 25 })).toEqual({ limit: 25, offset: 0 })
  })
})

describe('hasMoreRows', () => {
  it('is false for a paged table', () => {
    expect(hasMoreRows({ loadMore: false, page: 1, pageSize: 25, loadedRows: 25, lastBatchRows: 25, totalRows: 900 })).toBe(false)
  })

  it('compares against the reported total when there is one', () => {
    expect(hasMoreRows({ loadMore: true, page: 1, pageSize: 25, loadedRows: 25, lastBatchRows: 25, totalRows: 40 })).toBe(true)
    expect(hasMoreRows({ loadMore: true, page: 2, pageSize: 25, loadedRows: 40, lastBatchRows: 40, totalRows: 40 })).toBe(false)
  })

  it('stops when the engine reports a total but returns nothing', () => {
    expect(hasMoreRows({ loadMore: true, page: 2, pageSize: 25, loadedRows: 25, lastBatchRows: 0, totalRows: 900 })).toBe(false)
  })

  it('assumes more while an unbounded batch came back full', () => {
    expect(hasMoreRows({ loadMore: true, page: 2, pageSize: 25, loadedRows: 50, lastBatchRows: 50, totalRows: null })).toBe(true)
    expect(hasMoreRows({ loadMore: true, page: 2, pageSize: 25, loadedRows: 37, lastBatchRows: 37, totalRows: null })).toBe(false)
  })
})

describe('isMoversFilter', () => {
  it('accepts only the four movers presets', () => {
    expect(isMoversFilter('declining')).toBe(true)
    expect(isMoversFilter('default')).toBe(false)
    expect(isMoversFilter(undefined)).toBe(false)
  })
})

describe('hasCurrentWindowTraffic', () => {
  it('keeps a row with impressions but no clicks', () => {
    expect(hasCurrentWindowTraffic({ clicks: 0, impressions: 12 })).toBe(true)
  })

  it('rejects a comparison-only row', () => {
    expect(hasCurrentWindowTraffic({ clicks: 0, impressions: 0, prevClicks: 5 })).toBe(false)
  })
})

import { eq, page, resolveToBody } from 'gscdump/query'
import { describe, expect, it } from 'vitest'
import { andFilter, dateFilter } from './filter-wire'

describe('gsc filters', () => {
  it('resolves canonical date and dimension filters into a Search Console request', () => {
    const filter = andFilter(
      dateFilter({ start: '2026-07-01', end: '2026-07-31' }),
      eq(page, 'https://example.com/docs'),
    )

    expect(resolveToBody({ dimensions: ['date'], filter })).toEqual({
      dimensions: ['date'],
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'page',
          operator: 'equals',
          expression: 'https://example.com/docs',
        }],
      }],
    })
  })
})

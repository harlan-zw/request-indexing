import { describe, expect, it } from 'vitest'
import { isBrandTerm, positionFall } from './query-display'

describe('positionFall', () => {
  it('reports a fall past the threshold', () => {
    expect(positionFall({ position: 9, previousPosition: 4, impressions: 400 })).toEqual({ places: 5, from: 4, to: 9 })
  })

  it('ignores a move smaller than the threshold', () => {
    expect(positionFall({ position: 6, previousPosition: 4, impressions: 400 })).toBeNull()
  })

  it('ignores a query below the impressions floor', () => {
    expect(positionFall({ position: 20, previousPosition: 4, impressions: 12 })).toBeNull()
  })

  it('treats a missing rank as unmeasured, not as rank zero', () => {
    expect(positionFall({ position: 30, previousPosition: 0, impressions: 900 })).toBeNull()
    expect(positionFall({ position: 0, previousPosition: 3, impressions: 900 })).toBeNull()
    expect(positionFall({ position: 30, previousPosition: null, impressions: 900 })).toBeNull()
  })
})

describe('isBrandTerm', () => {
  it('matches the brand across spacing and casing', () => {
    expect(isBrandTerm('Nuxt SEO', ['nuxtseo'])).toBe(true)
    expect(isBrandTerm('nuxtseo pricing', ['nuxt seo'])).toBe(true)
  })

  it('does not match an unrelated query', () => {
    expect(isBrandTerm('nuxt sitemap', ['nuxtseo'])).toBe(false)
  })

  it('is false with no brand terms', () => {
    expect(isBrandTerm('nuxt seo', [])).toBe(false)
  })
})

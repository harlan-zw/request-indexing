import { describe, expect, it } from 'vitest'
import { isSearchOperatorQuery, operatorFreeKeyword, withoutSearchOperatorRows } from './search-operator-queries'

describe('isSearchOperatorQuery', () => {
  it('flags an operator query', () => {
    expect(isSearchOperatorQuery('site:nuxtseo.com')).toBe(true)
    expect(isSearchOperatorQuery('trailingslash false site:vercel.com/docs')).toBe(true)
    expect(isSearchOperatorQuery('-site:github.com nuxt')).toBe(true)
  })

  it('keeps source code pasted into the search box', () => {
    expect(isSearchOperatorQuery('"http: { cache: { enabled: true, maxage" nuxt')).toBe(false)
  })

  it('keeps an ordinary query', () => {
    expect(isSearchOperatorQuery('nuxt seo sitemap')).toBe(false)
    expect(isSearchOperatorQuery('')).toBe(false)
  })
})

describe('operatorFreeKeyword', () => {
  it('blanks an operator string', () => {
    expect(operatorFreeKeyword('site:nuxtseo.com')).toBeNull()
  })

  it('passes a real query through', () => {
    expect(operatorFreeKeyword('nuxt robots')).toBe('nuxt robots')
  })
})

describe('withoutSearchOperatorRows', () => {
  it('drops operator rows and trims to the intended length', () => {
    const rows = [{ q: 'a' }, { q: 'site:x.com' }, { q: 'b' }, { q: 'c' }]
    expect(withoutSearchOperatorRows(rows, r => r.q, 2)).toEqual([{ q: 'a' }, { q: 'b' }])
  })
})

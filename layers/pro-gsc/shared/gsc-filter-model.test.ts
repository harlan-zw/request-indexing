import { describe, expect, it } from 'vitest'
import {
  buildBrandFacet,
  buildQuestionFacet,
  getPeriodLabel,
  getSearchTypeLabel,
  QUESTION_REGEX,
  resolveStableData,
  SEARCH_TYPE_OPTIONS,
} from './gsc-filter-model'

describe('buildBrandFacet', () => {
  it('matches a long brand across punctuation and spacing', () => {
    const facet = buildBrandFacet('branded', ['nuxtseo'])
    expect(facet?.column).toBe('queryCanonical')
    expect(facet?.op).toBe('regex')
    expect(new RegExp(facet!.value, 'i').test('nuxt seo pricing')).toBe(true)
    expect(new RegExp(facet!.value, 'i').test('nuxt sitemap')).toBe(false)
  })

  it('bounds a short brand so it cannot match inside a longer word', () => {
    const facet = buildBrandFacet('branded', ['zap'])
    expect(new RegExp(facet!.value, 'i').test('zap docs')).toBe(true)
    expect(new RegExp(facet!.value, 'i').test('zapier docs')).toBe(false)
  })

  it('negates the same pattern for the non-branded mode', () => {
    expect(buildBrandFacet('nonbranded', ['nuxtseo'])?.op).toBe('notRegex')
  })

  it('returns nothing without a mode or without brand terms', () => {
    expect(buildBrandFacet('', ['nuxtseo'])).toBeNull()
    expect(buildBrandFacet('branded', [])).toBeNull()
  })

  it('returns nothing when the terms fold away to nothing', () => {
    expect(buildBrandFacet('branded', ['   '])).toBeNull()
  })
})

describe('buildQuestionFacet', () => {
  it('anchors question intent at the start of the query', () => {
    expect(buildQuestionFacet('questions')).toEqual({ column: 'queryCanonical', op: 'regex', value: QUESTION_REGEX })
    expect(new RegExp(QUESTION_REGEX, 'i').test('how to add a sitemap')).toBe(true)
    expect(new RegExp(QUESTION_REGEX, 'i').test('sitemap how to')).toBe(false)
  })

  it('negates the pattern for the non-questions mode', () => {
    expect(buildQuestionFacet('nonquestions')?.op).toBe('notRegex')
  })

  it('returns nothing without a mode', () => {
    expect(buildQuestionFacet('')).toBeNull()
  })
})

describe('getSearchTypeLabel', () => {
  it('names every slice the picker offers', () => {
    for (const option of SEARCH_TYPE_OPTIONS)
      expect(getSearchTypeLabel(option.value)).toBe(option.label)
  })
})

describe('getPeriodLabel', () => {
  it('reads a custom range in the reporting-day frame', () => {
    expect(getPeriodLabel('custom:2026-01-02:2026-02-03')).toBe('Jan 2 – Feb 3, 2026')
  })

  it('spells both years when a custom range crosses one', () => {
    expect(getPeriodLabel('custom:2025-12-30:2026-01-02')).toBe('Dec 30, 2025 – Jan 2, 2026')
  })

  it('falls back to the preset label', () => {
    expect(getPeriodLabel('28d')).not.toBe('28d')
  })
})

describe('resolveStableData', () => {
  it('passes a real boolean through', () => {
    expect(resolveStableData(false)).toBe(false)
    expect(resolveStableData(true)).toBe(true)
  })

  it('falls back for a hydrated null rather than reaching the SDK', () => {
    expect(resolveStableData(null)).toBe(true)
    expect(resolveStableData(undefined)).toBe(true)
  })
})

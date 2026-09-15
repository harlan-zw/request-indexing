import { describe, expect, it } from 'vitest'
import { resolveSiteSelection } from './site-selection'

describe('resolveSiteSelection', () => {
  const found = [
    { id: 'uuid-a', publicId: 's_a' },
    { id: 'uuid-b', publicId: 's_b' },
  ]

  it('maps every selected public id onto its row id', () => {
    expect(resolveSiteSelection(['s_b', 's_a'], found)).toEqual({
      _tag: 'Resolved',
      siteIds: ['uuid-b', 'uuid-a'],
    })
  })

  it('resolves an empty selection to no sites', () => {
    expect(resolveSiteSelection([], found)).toEqual({ _tag: 'Resolved', siteIds: [] })
  })

  it('names every selected id that matched no site instead of dropping it', () => {
    expect(resolveSiteSelection(['s_a', 'undefined', 's_zzz'], found)).toEqual({
      _tag: 'UnknownSites',
      unknown: ['undefined', 's_zzz'],
    })
  })

  it('collapses a repeated selection to one row id', () => {
    expect(resolveSiteSelection(['s_a', 's_a'], found)).toEqual({
      _tag: 'Resolved',
      siteIds: ['uuid-a'],
    })
  })
})

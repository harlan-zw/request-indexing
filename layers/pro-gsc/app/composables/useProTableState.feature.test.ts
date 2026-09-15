import { describe, expect, it } from 'vitest'
import { parseTableQueryPage, parseTableQueryString, useProTableState } from './useProTableState'

describe('parseTableQueryPage', () => {
  it('reads a positive integer page', () => {
    expect(parseTableQueryPage('4')).toBe(4)
  })

  it('falls back to the first page for anything else', () => {
    expect(parseTableQueryPage('0')).toBe(1)
    expect(parseTableQueryPage('-2')).toBe(1)
    expect(parseTableQueryPage('abc')).toBe(1)
    expect(parseTableQueryPage(undefined)).toBe(1)
  })
})

describe('parseTableQueryString', () => {
  it('falls back for an empty or non-string value', () => {
    expect(parseTableQueryString('', 'default')).toBe('default')
    expect(parseTableQueryString(['a'], 'default')).toBe('default')
    expect(parseTableQueryString('lost', 'default')).toBe('lost')
  })
})

describe('useProTableState', () => {
  it('toggles a preset back to the default and resets the page', () => {
    const state = useProTableState()
    state.setPage(3)
    state.toggleFilter('declining')
    expect(state.filter.value).toBe('declining')
    expect(state.page.value).toBe(1)

    state.setPage(2)
    state.toggleFilter('declining')
    expect(state.filter.value).toBe('default')
    expect(state.page.value).toBe(1)
  })

  it('flips direction when the same column is sorted twice', () => {
    const state = useProTableState({ defaultSort: { column: 'clicks', direction: 'desc' } })
    state.toggleSort('clicks')
    expect(state.sort.value).toEqual({ column: 'clicks', direction: 'asc' })
    state.toggleSort('clicks')
    expect(state.sort.value).toEqual({ column: 'clicks', direction: 'desc' })
  })

  it('starts a new column descending', () => {
    const state = useProTableState({ defaultSort: { column: 'clicks', direction: 'asc' } })
    state.toggleSort('position')
    expect(state.sort.value).toEqual({ column: 'position', direction: 'desc' })
  })
})

import { describe, expect, it } from 'vitest'
import { resolveUiTableRowId } from './table'

describe('resolveUiTableRowId', () => {
  it('gives rows without an id field distinct non-empty ids', () => {
    const rows = [{ clicks: 10 }, { clicks: 20 }, { clicks: 30 }]
    const ids = rows.map((row, index) => resolveUiTableRowId(row, index))
    expect(ids.every(id => id !== '')).toBe(true)
    expect(new Set(ids).size).toBe(rows.length)
  })

  it('uses the row id field when present', () => {
    expect(resolveUiTableRowId({ id: 'row-7' }, 3)).toBe('row-7')
  })

  it('stringifies a numeric id field', () => {
    expect(resolveUiTableRowId({ id: 42 }, 0)).toBe('42')
  })

  it('reads the id field named by a rowId prop', () => {
    expect(resolveUiTableRowId({ keyword: 'seo' }, 5, 'keyword')).toBe('seo')
  })

  it('calls a rowId function', () => {
    expect(resolveUiTableRowId({ a: 1 }, 9, row => `k-${row.a}`)).toBe('k-1')
  })

  it('falls back to the index when the id field is absent', () => {
    expect(resolveUiTableRowId({ clicks: 1 }, 4, 'keyword')).toBe('4')
  })
})

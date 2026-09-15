import { expect, it } from 'vitest'
import { tableAvailability } from './table-availability'

it('says nothing about rows while the first load is still open', () => {
  expect(tableAvailability({ isLoading: true, error: null, rowCount: 0 })).toEqual({ _tag: 'loading' })
})

it('still says nothing when a reload runs over rows it already has', () => {
  expect(tableAvailability({ isLoading: true, error: null, rowCount: 25 })).toEqual({ _tag: 'loading' })
})

it('reports rows once the load settles', () => {
  expect(tableAvailability({ isLoading: false, error: null, rowCount: 25 })).toEqual({ _tag: 'settled', hasRows: true })
})

it('reports an empty period as no rows', () => {
  expect(tableAvailability({ isLoading: false, error: null, rowCount: 0 })).toEqual({ _tag: 'settled', hasRows: false })
})

it('reports a failed load as no rows', () => {
  expect(tableAvailability({ isLoading: false, error: new Error('gscdump 500'), rowCount: 25 })).toEqual({ _tag: 'settled', hasRows: false })
})

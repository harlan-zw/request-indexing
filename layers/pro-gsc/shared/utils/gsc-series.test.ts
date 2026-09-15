import { describe, expect, it } from 'vitest'
import { projectPositionSeries, sparklineDateAxis } from './gsc-series'

const AXIS = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04']

describe('sparklineDateAxis', () => {
  it('lists every reporting day inclusively', () => {
    expect(sparklineDateAxis('2026-02-26', '2026-03-02')).toEqual([
      '2026-02-26',
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ])
  })

  it('returns the single day of a one-day window', () => {
    expect(sparklineDateAxis('2026-01-05', '2026-01-05')).toEqual(['2026-01-05'])
  })

  it('is empty when the window runs backwards', () => {
    expect(sparklineDateAxis('2026-01-05', '2026-01-01')).toEqual([])
  })
})

describe('projectPositionSeries', () => {
  it('carries the last observed rank across an unobserved day', () => {
    expect(projectPositionSeries([4, 0, 6, 7], AXIS)).toEqual({ values: [4, 4, 6, 7], dates: AXIS })
  })

  it('drops the run before the first observation with its dates', () => {
    expect(projectPositionSeries([0, 0, 5, 6], AXIS)).toEqual({
      values: [5, 6],
      dates: ['2026-01-03', '2026-01-04'],
    })
  })

  it('returns nothing when a single day cannot draw a line', () => {
    expect(projectPositionSeries([0, 0, 0, 9], AXIS)).toBeNull()
    expect(projectPositionSeries([0, 0, 0, 0], AXIS)).toBeNull()
  })
})

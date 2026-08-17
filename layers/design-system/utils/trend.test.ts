import { describe, expect, it } from 'vitest'
import { formatTrendDelta, resolveTrend, resolveTrendDelta } from './trend'

describe('resolveTrend', () => {
  it('reads a rise in a normal metric as an improvement', () => {
    const trend = resolveTrend(120, 100)
    expect(trend).toMatchObject({ delta: 20, direction: 'up', sign: '+', tone: 'positive' })
    expect(formatTrendDelta(trend)).toBe('+20%')
  })

  it('reads a fall in a normal metric as a decline', () => {
    const trend = resolveTrend(80, 100)
    expect(trend).toMatchObject({ delta: -20, direction: 'down', sign: '-', tone: 'negative' })
    expect(formatTrendDelta(trend)).toBe('-20%')
  })

  it('reads a rank gain in an inverted metric as an improvement', () => {
    // Search position 2.1 from 3.4: the number fell, the ranking improved.
    const trend = resolveTrend(2.1, 3.4, true)
    expect(trend.change).toBeLessThan(0)
    expect(trend).toMatchObject({ direction: 'up', sign: '+', tone: 'positive' })
    expect(formatTrendDelta(trend)).toBe('+38%')
  })

  it('reads a rank loss in an inverted metric as a decline', () => {
    // Search position 12 from 10: the number rose, the ranking got worse.
    const trend = resolveTrend(12, 10, true)
    expect(trend.change).toBeGreaterThan(0)
    expect(trend).toMatchObject({ direction: 'down', sign: '-', tone: 'negative' })
    expect(formatTrendDelta(trend)).toBe('-20%')
  })

  it('reports no movement as flat and unsigned', () => {
    const trend = resolveTrend(100, 100, true)
    expect(trend).toMatchObject({ delta: 0, direction: 'flat', sign: '', tone: 'neutral' })
    expect(formatTrendDelta(trend)).toBe('0%')
  })

  it('treats a missing previous value as flat rather than infinite', () => {
    expect(resolveTrend(50, 0)).toMatchObject({ direction: 'flat', tone: 'neutral' })
  })
})

describe('resolveTrendDelta', () => {
  it('keeps sign, arrow direction and tone in agreement for every input', () => {
    for (const change of [-999, -38, -1, 0, 1, 19, 999]) {
      for (const inverted of [false, true]) {
        const { delta, direction, sign, tone } = resolveTrendDelta(change, inverted)
        const expected = direction === 'up'
          ? { sign: '+', tone: 'positive' }
          : direction === 'down' ? { sign: '-', tone: 'negative' } : { sign: '', tone: 'neutral' }
        expect({ sign, tone }).toEqual(expected)
        expect(Math.sign(delta)).toBe(direction === 'up' ? 1 : direction === 'down' ? -1 : 0)
      }
    }
  })

  it('falls back to flat when the change is not a finite number', () => {
    expect(resolveTrendDelta(Number.NaN)).toMatchObject({ change: 0, direction: 'flat' })
  })

  it('formats a plain number delta without a percent sign', () => {
    expect(formatTrendDelta(resolveTrendDelta(-7), 'number')).toBe('-7')
  })
})

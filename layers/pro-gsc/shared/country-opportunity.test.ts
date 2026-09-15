import { describe, expect, it } from 'vitest'
import { projectCountryOpportunity } from './country-opportunity'

function row(country: string, clicks: number, impressions: number, ctr: number) {
  return { country, clicks, impressions, ctr, position: 5 }
}

describe('projectCountryOpportunity', () => {
  it('drops a country under the impression floor and counts it as hidden', () => {
    const result = projectCountryOpportunity([
      row('au', 400, 9000, 0.04),
      row('nz', 2, 3, 0.66),
    ])

    expect(result.points.map(p => p.country)).toEqual(['au'])
    expect(result.hiddenCount).toBe(1)
  })

  it('keeps a tiny sample rather than emptying the plot', () => {
    const result = projectCountryOpportunity([row('nz', 2, 3, 0.66)])

    expect(result.points.map(p => p.country)).toEqual(['nz'])
    expect(result.hiddenCount).toBe(0)
  })

  it('spreads three orders of magnitude of reach across the axis', () => {
    const [low, mid, high] = projectCountryOpportunity([
      row('nz', 1, 100, 0.01),
      row('au', 1, 10_000, 0.01),
      row('us', 1, 1_000_000, 0.01),
    ]).points

    expect(low!.x).toBeCloseTo(6)
    expect(mid!.x).toBeCloseTo(50)
    expect(high!.x).toBeCloseTo(94)
  })

  it('puts the best click-through rate at the top of the plot', () => {
    const [weak, strong] = projectCountryOpportunity([
      row('au', 10, 5000, 0.01),
      row('us', 10, 5000, 0.08),
    ]).points

    expect(strong!.y).toBeCloseTo(6)
    expect(weak!.y).toBeGreaterThan(strong!.y)
  })

  it('sizes markers by the square root of clicks so area tracks volume', () => {
    const [small, big] = projectCountryOpportunity([
      row('au', 100, 5000, 0.02),
      row('us', 400, 5000, 0.02),
    ]).points

    expect(big!.size).toBeCloseTo(46)
    expect(small!.size).toBeCloseTo(30)
  })

  it('returns nothing for no rows', () => {
    expect(projectCountryOpportunity([])).toEqual({ points: [], hiddenCount: 0 })
  })
})

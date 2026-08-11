import { afterEach, describe, expect, it, vi } from 'vitest'
import { daysAgo } from './useGscdump'

describe('daysAgo', () => {
  afterEach(() => vi.useRealTimers())

  it('uses the Search Console calendar day in Pacific time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T06:00:00Z'))

    expect(daysAgo(1)).toBe('2026-08-09')
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { isNearRetentionLimit } from './site-lifecycle'

describe('isNearRetentionLimit', () => {
  afterEach(() => vi.useRealTimers())

  it('uses the Search Console 16 month retention boundary', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T02:00:00Z'))

    expect(isNearRetentionLimit('2025-04-12')).toBe(false)
  })
})

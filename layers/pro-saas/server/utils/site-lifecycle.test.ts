import type { PartnerLifecycleResponse } from '#layers/pro-gsc/shared/gscdump-api'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { isNearRetentionLimit, readOptionalUserLifecycle } from './site-lifecycle'

describe('isNearRetentionLimit', () => {
  afterEach(() => vi.useRealTimers())

  it('uses the Search Console 16 month retention boundary', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T02:00:00Z'))

    expect(isNearRetentionLimit('2025-04-12')).toBe(false)
  })
})

describe('readOptionalUserLifecycle', () => {
  const lifecycle = { sites: [] } as unknown as PartnerLifecycleResponse

  it('loads the lifecycle for a user gscdump knows', async () => {
    const reader = { getUserLifecycle: async () => lifecycle }

    const result = await readOptionalUserLifecycle('gscdump-user-1', () => reader)

    expect(result).toEqual({ _tag: 'Loaded', lifecycle, reader })
  })

  it('skips the read for a user gscdump does not know', async () => {
    const createClient = vi.fn()

    const result = await readOptionalUserLifecycle(null, createClient)

    expect(result).toEqual({ _tag: 'Skipped' })
    expect(createClient).not.toHaveBeenCalled()
  })

  it('reports a client that fails to build instead of throwing', async () => {
    const result = await readOptionalUserLifecycle('gscdump-user-1', () => {
      throw new Error('GSCDUMP_API_KEY not configured')
    })

    expect(result).toEqual({ _tag: 'Unavailable', reason: 'GSCDUMP_API_KEY not configured' })
  })

  it('reports a lifecycle request that fails instead of throwing', async () => {
    const result = await readOptionalUserLifecycle('gscdump-user-1', () => ({
      getUserLifecycle: async () => {
        throw new Error('502 Bad Gateway')
      },
    }))

    expect(result).toEqual({ _tag: 'Unavailable', reason: '502 Bad Gateway' })
  })
})

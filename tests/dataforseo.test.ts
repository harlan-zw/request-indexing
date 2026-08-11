import { describe, expect, it } from 'vitest'
import { DATAFORSEO_RETRY_OPTIONS, runDataForSEORequest } from '../shared/dataforseo'

describe('dataForSEO requests', () => {
  it('retries transient Cloudflare and upstream failures', () => {
    expect(DATAFORSEO_RETRY_OPTIONS).toEqual(expect.objectContaining({
      retry: 2,
      retryStatusCodes: expect.arrayContaining([429, 500, 520, 524]),
    }))
  })

  it('returns transient upstream errors as expected failures', async () => {
    const outcome = await runDataForSEORequest(() => Promise.reject(
      Object.assign(new Error('upstream unavailable'), { statusCode: 520 }),
    ))

    expect(outcome).toEqual({ _tag: 'Unavailable', statusCode: 520 })
  })

  it('does not hide non-transient failures', async () => {
    const error = Object.assign(new Error('unauthorized'), { statusCode: 401 })

    await expect(runDataForSEORequest(() => Promise.reject(error))).rejects.toBe(error)
  })
})

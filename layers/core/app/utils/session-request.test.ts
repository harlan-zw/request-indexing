import { describe, expect, it } from 'vitest'
import { readSessionScoped } from './session-request'

describe('readSessionScoped', () => {
  it('returns the loaded value', async () => {
    await expect(readSessionScoped(() => Promise.resolve({ sites: [], jobStatus: 'ready' })))
      .resolves
      .toEqual({ _tag: 'Ready', value: { sites: [], jobStatus: 'ready' } })
  })

  it('reads a 401 as an expired session instead of throwing', async () => {
    const unauthorized = Object.assign(new Error('[GET] "/api/sites/preview": 401'), { status: 401 })
    await expect(readSessionScoped(() => Promise.reject(unauthorized)))
      .resolves
      .toEqual({ _tag: 'SessionExpired' })
  })

  it('reads a 401 carried on a serialised NuxtError', async () => {
    const unauthorized = Object.assign(new Error('Unauthorized'), { data: { statusCode: 401 } })
    await expect(readSessionScoped(() => Promise.reject(unauthorized)))
      .resolves
      .toEqual({ _tag: 'SessionExpired' })
  })

  it('rethrows a server failure', async () => {
    const failure = Object.assign(new Error('boom'), { status: 500 })
    await expect(readSessionScoped(() => Promise.reject(failure))).rejects.toBe(failure)
  })

  it('rethrows a failure with no status', async () => {
    const failure = new Error('offline')
    await expect(readSessionScoped(() => Promise.reject(failure))).rejects.toBe(failure)
  })
})

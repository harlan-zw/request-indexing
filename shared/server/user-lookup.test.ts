import { describe, expect, it } from 'vitest'
import { lookupUser } from './user-lookup'

describe('lookupUser', () => {
  it('reports a row that came back', async () => {
    await expect(lookupUser(async () => ({ userId: 'user-1' })))
      .resolves
      .toEqual({ _tag: 'Found', user: { userId: 'user-1' } })
  })

  it('reports a missing row as NotFound', async () => {
    await expect(lookupUser(async () => undefined)).resolves.toEqual({ _tag: 'NotFound' })
    await expect(lookupUser(async () => null)).resolves.toEqual({ _tag: 'NotFound' })
  })

  it('keeps a failed read apart from a missing row', async () => {
    const cause = new Error('D1_ERROR: network')
    await expect(lookupUser(() => Promise.reject(cause)))
      .resolves
      .toEqual({ _tag: 'Unavailable', cause })
  })
})

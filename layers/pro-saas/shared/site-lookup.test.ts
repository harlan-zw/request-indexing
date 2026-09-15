import { describe, expect, it } from 'vitest'
import { classifySiteLookupFailure, readSiteLookup } from './site-lookup'

describe('classifySiteLookupFailure', () => {
  it('reads a 404 as a Site that does not exist', () => {
    expect(classifySiteLookupFailure({ statusCode: 404 })).toEqual({ _tag: 'NotFound' })
  })

  it('never calls a failed read a missing Site', () => {
    expect(classifySiteLookupFailure({ statusCode: 500 })).toEqual({ _tag: 'Unavailable', status: 500 })
    expect(classifySiteLookupFailure({ statusCode: 401 })).toEqual({ _tag: 'Unavailable', status: 401 })
    expect(classifySiteLookupFailure(new Error('network down'))).toEqual({ _tag: 'Unavailable', status: null })
  })
})

describe('readSiteLookup', () => {
  it('returns the Site the endpoint answered with', async () => {
    const lookup = await readSiteLookup(async () => ({ site: { publicId: 's_kv1109' } }), 's_kv1109')
    expect(lookup).toEqual({ _tag: 'Found', site: { publicId: 's_kv1109' } })
  })

  it('reports an id that names no Site', async () => {
    const lookup = await readSiteLookup(() => Promise.reject(Object.assign(new Error('Not Found'), { statusCode: 404 })), 's_nope')
    expect(lookup).toEqual({ _tag: 'NotFound' })
  })

  it('does not report an outage as a missing Site', async () => {
    const lookup = await readSiteLookup(() => Promise.reject(Object.assign(new Error('Server Error'), { statusCode: 500 })), 's_kv1109')
    expect(lookup).toEqual({ _tag: 'Unavailable', status: 500 })
  })

  it('escapes the id it puts in the path', async () => {
    const seen: string[] = []
    await readSiteLookup(async (url) => {
      seen.push(url)
      return { site: {} }
    }, 'a/b')
    expect(seen).toEqual(['/api/pro/sites/a%2Fb'])
  })
})

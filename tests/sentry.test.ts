import { describe, expect, it } from 'vitest'
import { errorStatusCode } from '../shared/sentry'

describe('errorStatusCode', () => {
  it('reads an h3 error status', () => {
    expect(errorStatusCode(Object.assign(new Error('Page not found'), { statusCode: 404 }))).toBe(404)
  })

  it('reads a fetch response status', () => {
    expect(errorStatusCode(Object.assign(new Error('nope'), { status: 401 }))).toBe(401)
  })

  it('reads a serialised NuxtError status', () => {
    expect(errorStatusCode(Object.assign(new Error('Page not found'), { data: { statusCode: 404 } }))).toBe(404)
  })

  it('reads through a wrapped cause', () => {
    const cause = Object.assign(new Error('Page not found'), { statusCode: 404 })
    expect(errorStatusCode(new Error('render failed', { cause }))).toBe(404)
  })

  it('has no status for a plain error', () => {
    expect(errorStatusCode(new Error('boom'))).toBeUndefined()
    expect(errorStatusCode(undefined)).toBeUndefined()
  })
})

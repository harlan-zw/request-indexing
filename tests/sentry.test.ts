import { describe, expect, it } from 'vitest'
import { dropExpectedNotFound, errorStatusCode, resolveServerSentryInitialization } from '../shared/sentry'

describe('resolveServerSentryInitialization', () => {
  it('keeps an unversioned local build out of production Sentry', () => {
    expect(resolveServerSentryInitialization({
      enabled: true,
      dsn: 'https://public@example.invalid/1',
      release: '',
    })).toEqual({ _tag: 'Disabled', reason: 'missing-release' })
  })

  it('enables a versioned production build', () => {
    expect(resolveServerSentryInitialization({
      enabled: true,
      dsn: 'https://public@example.invalid/1',
      release: 'abc123',
    })).toEqual({
      _tag: 'Enabled',
      dsn: 'https://public@example.invalid/1',
      release: 'abc123',
    })
  })
})

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

describe('dropExpectedNotFound', () => {
  const event = { event_id: 'abc' }

  it('drops a 404', () => {
    const notFound = Object.assign(new Error('Page not found'), { statusCode: 404 })
    expect(dropExpectedNotFound(event, { originalException: notFound })).toBeNull()
  })

  it('keeps a 500', () => {
    const failure = Object.assign(new Error('boom'), { statusCode: 500 })
    expect(dropExpectedNotFound(event, { originalException: failure })).toBe(event)
  })

  it('keeps an error with no status', () => {
    expect(dropExpectedNotFound(event, { originalException: new Error('boom') })).toBe(event)
    expect(dropExpectedNotFound(event)).toBe(event)
  })
})

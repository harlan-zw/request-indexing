import { describe, expect, it } from 'vitest'
import { dropExpectedNotFound, errorStatusCode, resolveSentryTarget } from '../shared/sentry'

describe('resolveSentryTarget', () => {
  it('reports a deployed build', () => {
    expect(resolveSentryTarget({ nodeEnv: 'production', release: 'e75a05b0' }))
      .toEqual({ _tag: 'Enabled', environment: 'production', release: 'e75a05b0' })
  })

  it('stays silent for a local production build with no release', () => {
    expect(resolveSentryTarget({ nodeEnv: 'production', release: undefined }))
      .toEqual({ _tag: 'Disabled', reason: 'unreleased-build' })
    expect(resolveSentryTarget({ nodeEnv: 'production', release: '   ' }))
      .toEqual({ _tag: 'Disabled', reason: 'unreleased-build' })
  })

  it('stays silent outside a production build', () => {
    expect(resolveSentryTarget({ nodeEnv: 'development', release: 'e75a05b0' }))
      .toEqual({ _tag: 'Disabled', reason: 'development' })
    expect(resolveSentryTarget({}))
      .toEqual({ _tag: 'Disabled', reason: 'development' })
  })

  it('takes the environment name from the deploy when one is given', () => {
    expect(resolveSentryTarget({ nodeEnv: 'production', release: 'abc', environment: 'staging' }))
      .toEqual({ _tag: 'Enabled', environment: 'staging', release: 'abc' })
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

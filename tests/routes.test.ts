import { describe, expect, it } from 'vitest'
import { isRuntimeOnlyRoute, RUNTIME_ONLY_ROUTE_PREFIXES, runtimeOnlyRouteRules } from '../shared/routes'

describe('isRuntimeOnlyRoute', () => {
  it.each([
    '/dashboard',
    '/dashboard/team/setup',
    '/pro/dashboard/sites/1/indexing',
    '/account',
    '/admin/users',
    '/kit/buttons',
    '/team-invitations/abc',
    '/api/sites/preview',
    '/dashboard?tab=sites',
    '/dashboard#top',
  ])('treats %s as runtime only', (path) => {
    expect(isRuntimeOnlyRoute(path)).toBe(true)
  })

  it.each([
    '/',
    '/login',
    '/get-started',
    '/guides',
    '/tools/google-indexing-checker',
    '/comparisons/some-rival',
    '/accounts-payable',
    '/dashboards-explained',
  ])('treats %s as prerendered', (path) => {
    expect(isRuntimeOnlyRoute(path)).toBe(false)
  })
})

describe('runtimeOnlyRouteRules', () => {
  it('marks every runtime-only prefix as not prerendered', () => {
    const rules = runtimeOnlyRouteRules()

    expect(Object.keys(rules)).toHaveLength(RUNTIME_ONLY_ROUTE_PREFIXES.length)
    expect(rules['/dashboard/**']).toEqual({ prerender: false })
    expect(Object.values(rules).every(rule => rule.prerender === false)).toBe(true)
  })
})

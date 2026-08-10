import { describe, expect, it } from 'vitest'
import { requiresAuthentication } from './auth-routes'

describe('requiresAuthentication', () => {
  it.each([
    '/dashboard',
    '/dashboard/site/1',
    '/account',
    '/pro/dashboard',
    '/pro/dashboard/teams/create',
  ])('protects %s', (path) => {
    expect(requiresAuthentication(path)).toBe(true)
  })

  it.each([
    '/',
    '/login',
    '/pro/pricing',
    '/tools/google-indexing-checker',
  ])('leaves %s public', (path) => {
    expect(requiresAuthentication(path)).toBe(false)
  })
})

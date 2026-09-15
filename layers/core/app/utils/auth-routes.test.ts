import { describe, expect, it } from 'vitest'
import { requiresAuthentication } from './auth-routes'

describe('requiresAuthentication', () => {
  it.each([
    '/pro/dashboard',
    '/pro/dashboard/account',
    '/pro/dashboard/sites/s_kv1109/indexing',
  ])('protects %s', (path) => {
    expect(requiresAuthentication(path)).toBe(true)
  })

  it.each([
    '/',
    '/login',
    '/dashboard',
    '/pro/pricing',
    '/tools/google-indexing-checker',
  ])('leaves %s public', (path) => {
    expect(requiresAuthentication(path)).toBe(false)
  })
})

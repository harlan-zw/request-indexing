import { describe, expect, it } from 'vitest'
import { safeAuthRedirect } from './auth-redirect'

describe('safeAuthRedirect', () => {
  it.each([
    ['/pro/dashboard', '/pro/dashboard'],
    ['/pro/dashboard/sites/s_kv1109/indexing', '/pro/dashboard/sites/s_kv1109/indexing'],
    ['/pro/dashboard/account?tab=identities', '/pro/dashboard/account?tab=identities'],
  ])('allows authenticated app paths', (input, expected) => {
    expect(safeAuthRedirect(input)).toBe(expected)
  })

  it.each([
    '/login',
    '/dashboard',
    '//example.com/pro/dashboard',
    '/pro/dashboard/../admin',
    'https://example.com/pro/dashboard',
  ])('rejects unsafe or obsolete paths', (input) => {
    expect(safeAuthRedirect(input)).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { safeAuthRedirect } from './auth-redirect'

describe('safeAuthRedirect', () => {
  it.each([
    ['/dashboard', '/dashboard'],
    ['/dashboard/site/example', '/dashboard/site/example'],
    ['/account?tab=billing', '/account?tab=billing'],
  ])('allows authenticated app paths', (input, expected) => {
    expect(safeAuthRedirect(input)).toBe(expected)
  })

  it.each([
    '/login',
    '/pro/dashboard',
    '//example.com/dashboard',
    '/dashboard/../admin',
    'https://example.com/dashboard',
  ])('rejects unsafe or obsolete paths', (input) => {
    expect(safeAuthRedirect(input)).toBeNull()
  })
})

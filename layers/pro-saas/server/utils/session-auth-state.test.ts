import { describe, expect, it } from 'vitest'
import { hasAuthenticatedSession } from './session-auth-state'

describe('hasAuthenticatedSession', () => {
  it('does not treat an anonymous session fetch as a logout', () => {
    expect(hasAuthenticatedSession({})).toBe(false)
    expect(hasAuthenticatedSession({ user: null })).toBe(false)
  })

  it('accepts a session with a user id', () => {
    expect(hasAuthenticatedSession({ user: { id: 'user-1' } })).toBe(true)
  })
})

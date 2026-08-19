import { describe, expect, it } from 'vitest'
import { resolveSessionIdentity } from '../shared/server/session-identity'

describe('resolveSessionIdentity', () => {
  it('reads the signed-in user id', () => {
    expect(resolveSessionIdentity({ user: { id: 42 } })).toEqual({ _tag: 'SignedIn', userId: 42 })
  })

  it('reads a user id stored as digits', () => {
    expect(resolveSessionIdentity({ user: { id: '42' } })).toEqual({ _tag: 'SignedIn', userId: 42 })
  })

  it.each([
    ['no session', null],
    ['no user', {}],
    ['a null user', { user: null }],
    ['a user with no id', { user: {} }],
    ['an undefined id', { user: { id: undefined } }],
    ['a non-numeric id', { user: { id: 'kv1112' } }],
    ['a zero id', { user: { id: 0 } }],
  ])('reports %s as signed out', (_label, session) => {
    expect(resolveSessionIdentity(session)).toEqual({ _tag: 'SignedOut' })
  })
})

import { describe, expect, it } from 'vitest'
import { needsOnboarding, resolveUserOnboarding } from './onboarding'

describe('resolveUserOnboarding', () => {
  it('reports a signed-out session', () => {
    expect(resolveUserOnboarding(undefined)).toEqual({ _tag: 'SignedOut' })
    expect(resolveUserOnboarding({})).toEqual({ _tag: 'SignedOut' })
  })

  it('reports a user who has not finished onboarding', () => {
    expect(resolveUserOnboarding({ user: { id: 1 } })).toEqual({ _tag: 'NotOnboarded' })
    expect(resolveUserOnboarding({ user: { id: 1 }, onboardingCompletedAt: null })).toEqual({ _tag: 'NotOnboarded' })
  })

  it('reports a finished user with the time they finished', () => {
    expect(resolveUserOnboarding({ user: { id: 1 }, onboardingCompletedAt: '2026-09-15T00:00:00.000Z' }))
      .toEqual({ _tag: 'Onboarded', completedAt: '2026-09-15T00:00:00.000Z' })
  })
})

describe('needsOnboarding', () => {
  it('sends an unfinished user to onboarding', () => {
    expect(needsOnboarding(resolveUserOnboarding({ user: { id: 1 } }))).toBe(true)
  })

  it('leaves a finished user alone, whichever team they are on', () => {
    expect(needsOnboarding(resolveUserOnboarding({ user: { id: 1 }, onboardingCompletedAt: '2026-09-15T00:00:00.000Z' }))).toBe(false)
  })

  it('leaves a signed-out session to the auth middleware', () => {
    expect(needsOnboarding(resolveUserOnboarding(null))).toBe(false)
  })
})

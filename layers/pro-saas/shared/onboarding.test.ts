import { describe, expect, it } from 'vitest'
import {
  ONBOARDING_ROUTE,
  onboardingStepIndex,
  parseOnboardingStep,
  resolveOnboardingCompletion,
  resolveOnboardingGate,
  resolveOnboardingResumeStep,
} from './onboarding'

describe('resolveOnboardingResumeStep', () => {
  it('starts at connect while Google Search Console is not connected', () => {
    expect(resolveOnboardingResumeStep({ gscConnected: false, hasSites: false })).toBe('connect')
    expect(resolveOnboardingResumeStep({ gscConnected: false, hasSites: true })).toBe('connect')
  })

  it('resumes at sites once Google is connected and no site exists', () => {
    expect(resolveOnboardingResumeStep({ gscConnected: true, hasSites: false })).toBe('sites')
  })

  it('resumes at sync once a site exists', () => {
    expect(resolveOnboardingResumeStep({ gscConnected: true, hasSites: true })).toBe('sync')
  })
})

describe('parseOnboardingStep', () => {
  it('accepts every declared step', () => {
    expect(parseOnboardingStep('connect')).toBe('connect')
    expect(parseOnboardingStep('sites')).toBe('sites')
    expect(parseOnboardingStep('sync')).toBe('sync')
  })

  it('rejects anything else', () => {
    expect(parseOnboardingStep('plan')).toBeNull()
    expect(parseOnboardingStep('')).toBeNull()
    expect(parseOnboardingStep(undefined)).toBeNull()
    expect(parseOnboardingStep(['sites'])).toBeNull()
  })
})

describe('onboardingStepIndex', () => {
  it('orders the steps as the progress rail renders them', () => {
    expect(onboardingStepIndex('connect')).toBe(0)
    expect(onboardingStepIndex('sites')).toBe(1)
    expect(onboardingStepIndex('sync')).toBe(2)
  })
})

describe('resolveOnboardingGate', () => {
  const onboarded = {
    loggedIn: true,
    onboardingCompletedAt: '2026-09-01T00:00:00.000Z',
    gscConnected: true,
    hasSites: true,
  }
  const halfway = {
    loggedIn: true,
    onboardingCompletedAt: null,
    gscConnected: true,
    hasSites: false,
  }

  it('ignores every path outside the dashboard', () => {
    expect(resolveOnboardingGate({ ...halfway, path: '/' })).toEqual({ _tag: 'Allow' })
    expect(resolveOnboardingGate({ ...halfway, path: '/login' })).toEqual({ _tag: 'Allow' })
    expect(resolveOnboardingGate({ ...halfway, path: '/auth/google' })).toEqual({ _tag: 'Allow' })
  })

  it('leaves a signed-out visitor to the auth middleware', () => {
    expect(resolveOnboardingGate({ ...halfway, loggedIn: false, path: '/pro/dashboard' })).toEqual({ _tag: 'Allow' })
  })

  it('sends a half-onboarded user to the step they are up to', () => {
    expect(resolveOnboardingGate({ ...halfway, path: '/pro/dashboard' })).toEqual({
      _tag: 'Redirect',
      path: ONBOARDING_ROUTE,
      query: { step: 'sites' },
    })
  })

  it('keeps the account pages reachable during onboarding', () => {
    expect(resolveOnboardingGate({ ...halfway, path: '/pro/dashboard/account' })).toEqual({ _tag: 'Allow' })
    expect(resolveOnboardingGate({ ...halfway, path: '/account/billing' })).toEqual({ _tag: 'Allow' })
  })

  it('never redirects the wizard onto itself', () => {
    expect(resolveOnboardingGate({ ...halfway, path: ONBOARDING_ROUTE })).toEqual({ _tag: 'Allow' })
  })

  it('takes a finished user off the wizard', () => {
    expect(resolveOnboardingGate({ ...onboarded, path: ONBOARDING_ROUTE })).toEqual({
      _tag: 'Redirect',
      path: '/pro/dashboard',
    })
  })

  it('leaves a finished user alone everywhere else', () => {
    expect(resolveOnboardingGate({ ...onboarded, path: '/pro/dashboard/sites/s_abc/indexing' })).toEqual({ _tag: 'Allow' })
  })
})

describe('resolveOnboardingCompletion', () => {
  const now = new Date('2026-09-15T10:00:00.000Z')

  it('refuses to finish onboarding with no site connected', () => {
    expect(resolveOnboardingCompletion({ completedAt: null, hasSites: false, now })).toEqual({
      _tag: 'Blocked',
      reason: 'no_sites',
      message: 'Connect at least one site before you finish setup.',
    })
  })

  it('stamps the clock when a site is connected', () => {
    expect(resolveOnboardingCompletion({ completedAt: null, hasSites: true, now })).toEqual({
      _tag: 'Complete',
      completedAt: '2026-09-15T10:00:00.000Z',
    })
  })

  it('is idempotent for a user who already finished', () => {
    expect(resolveOnboardingCompletion({
      completedAt: new Date('2026-09-01T00:00:00.000Z'),
      hasSites: false,
      now,
    })).toEqual({
      _tag: 'AlreadyComplete',
      completedAt: '2026-09-01T00:00:00.000Z',
    })
  })
})

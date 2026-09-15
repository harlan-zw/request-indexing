/**
 * The session shape the onboarding decision reads. Kept structural so the
 * decision stays a pure function of data, testable without a Nuxt session.
 */
export interface OnboardingSessionInput {
  user?: { id: number } | null
  onboardingCompletedAt?: string | null
}

/**
 * Onboarding progress for the signed-in user.
 *
 * The flag used to hang off the current team, so joining or creating a second
 * team sent an onboarded person back through setup.
 */
export type UserOnboarding
  = | { _tag: 'SignedOut' }
    | { _tag: 'NotOnboarded' }
    | { _tag: 'Onboarded', completedAt: string }

export function resolveUserOnboarding(session: OnboardingSessionInput | null | undefined): UserOnboarding {
  if (!session?.user)
    return { _tag: 'SignedOut' }

  const completedAt = session.onboardingCompletedAt
  if (!completedAt)
    return { _tag: 'NotOnboarded' }

  return { _tag: 'Onboarded', completedAt }
}

/**
 * True when the user must be sent to onboarding. A signed-out session is not
 * onboarded either, but the auth middleware owns that redirect.
 */
export function needsOnboarding(state: UserOnboarding): boolean {
  return state._tag === 'NotOnboarded'
}

/** Where a user goes to finish onboarding. */
export const ONBOARDING_ROUTE = '/dashboard/team/setup'

/**
 * The session shape the onboarding decision reads. Kept structural so the
 * decision stays a pure function of data, testable without a Nuxt session.
 */
export interface OnboardingSessionInput {
  user?: { id: number } | null
  team?: { teamId: number, onboardedStep: string | null } | null
}

/**
 * Onboarding progress for the signed-in user.
 *
 * `NoTeam` is an expected state, not a fault: a session can reach the dashboard
 * before a team row exists. Reading `onboardedStep` off that absent team is
 * what used to throw "Cannot read properties of undefined".
 */
export type TeamOnboarding
  = | { _tag: 'SignedOut' }
    | { _tag: 'NoTeam' }
    | { _tag: 'NotOnboarded', teamId: number }
    | { _tag: 'Onboarded', teamId: number, step: string }

export function resolveTeamOnboarding(session: OnboardingSessionInput | null | undefined): TeamOnboarding {
  if (!session?.user)
    return { _tag: 'SignedOut' }

  const team = session.team
  if (!team)
    return { _tag: 'NoTeam' }

  if (!team.onboardedStep)
    return { _tag: 'NotOnboarded', teamId: team.teamId }

  return { _tag: 'Onboarded', teamId: team.teamId, step: team.onboardedStep }
}

/**
 * True when the user must be sent to onboarding. A signed-out session is not
 * onboarded either, but the auth middleware owns that redirect.
 */
export function needsOnboarding(state: TeamOnboarding): boolean {
  return state._tag === 'NoTeam' || state._tag === 'NotOnboarded'
}

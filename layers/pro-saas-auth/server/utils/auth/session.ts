import type { H3Event } from 'h3'
import type { AuthIdentityRow, AuthProviderId, SessionUser } from '../../../shared/types/auth'

export function buildSessionUser(
  user: { id: number, currentTeamId?: number | null },
  primaryIdentity: AuthIdentityRow,
): SessionUser {
  return {
    id: user.id,
    email: primaryIdentity.email,
    name: primaryIdentity.displayName,
    avatarUrl: primaryIdentity.avatarUrl,
    authProvider: primaryIdentity.provider,
    currentTeamId: user.currentTeamId ?? null,
  }
}

export async function setAuthSession(
  event: H3Event,
  user: { id: number, apiKey: string | null, currentTeamId: number | null },
  identity: AuthIdentityRow,
) {
  const sessionUser = buildSessionUser(user, identity)
  await setUserSession(event, {
    user: sessionUser,
    apiKey: user.apiKey ?? undefined,
  })
}

export function rememberLastProvider(_event: H3Event, _providerId: AuthProviderId) {
  // No-op on the server: the last-used hint is browser-local (localStorage),
  // written by the login page on click. Server doesn't track it; kept here as a
  // seam for analytics/auditing if we ever change our minds.
}

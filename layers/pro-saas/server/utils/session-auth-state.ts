interface SessionAuthState {
  user?: { id?: string | null } | null
}

type AuthenticatedSessionAuthState = SessionAuthState & {
  user: { id: string }
}

export function hasAuthenticatedSession(session: SessionAuthState): session is AuthenticatedSessionAuthState {
  return !!session.user?.id
}

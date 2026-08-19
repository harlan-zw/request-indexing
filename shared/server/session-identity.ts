/**
 * The signed-in user carried by a session cookie.
 *
 * `SignedOut` is an expected state, not a fault. Keeping it as its own tag is
 * what stops an absent id reaching a database bind: `authenticateUser` used to
 * read `session.sessionId`, a field nothing has written since the auth flow
 * moved to `session.user`, and pass that `undefined` straight to D1. Every
 * request to a route behind `authenticateUser` failed with
 * `D1_TYPE_ERROR: Type 'undefined' not supported for value 'undefined'` and
 * returned 500 where it owed 401.
 */
export type SessionIdentity
  = | { _tag: 'SignedOut' }
    | { _tag: 'SignedIn', userId: number }

interface SessionIdentityInput {
  user?: { id?: unknown } | null
}

/**
 * Parse a session into the user id a query may bind.
 *
 * `users.user_id` is an integer primary key. A session cookie is untrusted
 * input, so the id is parsed here once and the result carries a number or
 * nothing. No caller can bind anything else.
 */
export function resolveSessionIdentity(session: SessionIdentityInput | null | undefined): SessionIdentity {
  const id = session?.user?.id

  if (typeof id === 'number' && Number.isInteger(id) && id > 0)
    return { _tag: 'SignedIn', userId: id }

  // A cookie written before the id was stored as a number still carries the
  // digits as a string. Accept that spelling rather than sign the user out.
  if (typeof id === 'string' && /^[1-9]\d*$/.test(id))
    return { _tag: 'SignedIn', userId: Number(id) }

  return { _tag: 'SignedOut' }
}

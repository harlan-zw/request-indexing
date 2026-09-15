// A user row read, with "the row is gone" kept apart from "the read failed".
//
// `db.query.users.findFirst(...).catch(() => null)` collapsed both into `null`,
// and every caller read that `null` as "this account no longer exists". One
// transient D1 failure therefore cleared a live session and signed the owner
// out mid-use (prod play-through 2026-09-16, D4). The session plugin, the
// caller seam and `authenticateUser` all carried that shape.
//
// The three outcomes are different decisions, so they are three tags:
//
//   Found        the row is here; enrich and continue.
//   NotFound     the row is gone; the cookie names nobody, so clear it.
//   Unavailable  the database did not answer; fail the REQUEST, never the
//                session. The sealed cookie is still the best evidence we have.

export type UserLookup<TUser>
  = | { _tag: 'Found', user: TUser }
    | { _tag: 'NotFound' }
    | { _tag: 'Unavailable', cause: unknown }

/**
 * Run a single-row read and tag its outcome.
 *
 * `read` returns the row, or null/undefined when the row does not exist, and
 * rejects when the database could not answer. Only the first case is evidence
 * about the account.
 */
export async function lookupUser<TUser>(
  read: () => Promise<TUser | null | undefined>,
): Promise<UserLookup<TUser>> {
  try {
    const user = await read()
    return user ? { _tag: 'Found', user } : { _tag: 'NotFound' }
  }
  catch (cause: unknown) {
    return { _tag: 'Unavailable', cause }
  }
}

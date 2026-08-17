import { errorStatusCode } from '#shared/sentry'

/**
 * Outcome of a dashboard request that needs a signed-in session.
 *
 * A 401 means the cookie outlived the server session, which is the ordinary end
 * of a long-open tab rather than a fault. Returning it as a value keeps it off
 * the unhandled-rejection path, where it reached Sentry as
 * `FetchError: [GET] "/api/sites/preview": 401` and broke the page.
 */
export type SessionScopedResult<T>
  = | { _tag: 'Ready', value: T }
    | { _tag: 'SessionExpired' }

/**
 * Runs a session-scoped request and reports an expired session as a value.
 *
 * Every other failure still rejects, so a genuine server fault keeps its stack
 * and still reports.
 */
export function readSessionScoped<T>(request: () => Promise<T>): Promise<SessionScopedResult<T>> {
  return request()
    .then(value => ({ _tag: 'Ready', value }) as const)
    .catch((error: unknown) => {
      if (errorStatusCode(error) === 401)
        return { _tag: 'SessionExpired' } as const
      throw error
    })
}

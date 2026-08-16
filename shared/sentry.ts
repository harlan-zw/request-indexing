export const SENTRY_DSN = 'https://285c1e24a3cb947359ebc30e95ad7746@o4510507748163584.ingest.us.sentry.io/4511887363080192'

/**
 * Whether a build may report to Sentry, and under what identity.
 *
 * `Disabled` carries the reason so a build never silently loses reporting.
 */
export type SentryTarget
  = | { _tag: 'Disabled', reason: 'development' | 'unreleased-build' }
    | { _tag: 'Enabled', environment: string, release: string }

/**
 * `NODE_ENV === 'production'` is not proof of a deploy. `wrangler dev` and
 * `nuxt preview` run the production build on a laptop, so a local worker used
 * to report into the production project: REQUEST-INDEXING-C arrived from
 * `.wrangler/tmp/dev-*` in a developer worktree, tagged `environment:production`
 * and carrying no release, while every deployed event carries one.
 *
 * Only the deploy pipeline sets a release (`GITHUB_SHA` in the workflow, or an
 * explicit `SENTRY_RELEASE`). Requiring one makes "reporting as production from
 * a machine that never deployed" unrepresentable.
 */
export function resolveSentryTarget(input: {
  nodeEnv?: string
  release?: string
  environment?: string
}): SentryTarget {
  if (input.nodeEnv !== 'production')
    return { _tag: 'Disabled', reason: 'development' }

  const release = input.release?.trim()
  if (!release)
    return { _tag: 'Disabled', reason: 'unreleased-build' }

  return { _tag: 'Enabled', environment: input.environment?.trim() || 'production', release }
}

export function createSentryDataCollection() {
  return {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
  }
}

/**
 * HTTP status carried by an error, across the shapes this app produces:
 * `statusCode` on an H3Error, `status` on a fetch failure, and `data.statusCode`
 * on a NuxtError serialised across the SSR boundary.
 */
export function errorStatusCode(error: unknown): number | undefined {
  if (!error || typeof error !== 'object')
    return undefined

  const record = error as {
    statusCode?: unknown
    status?: unknown
    data?: { statusCode?: unknown } | null
    cause?: unknown
  }

  const candidates = [record.statusCode, record.status, record.data?.statusCode]
  const status = candidates.find(value => typeof value === 'number') as number | undefined
  if (status !== undefined)
    return status

  return record.cause && record.cause !== error ? errorStatusCode(record.cause) : undefined
}

/**
 * Drops 404s before they reach Sentry.
 *
 * A 404 means a URL has no page, which happens whenever a stale link or a
 * crawler asks for one. That is an expected answer, not a fault worth an alert.
 * Every other error, including a 500 the router raised, still reports.
 */
export function dropExpectedNotFound<TEvent>(
  event: TEvent,
  hint?: { originalException?: unknown },
): TEvent | null {
  return errorStatusCode(hint?.originalException) === 404 ? null : event
}

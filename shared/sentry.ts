export const SENTRY_DSN = 'https://285c1e24a3cb947359ebc30e95ad7746@o4510507748163584.ingest.us.sentry.io/4511887363080192'

interface SentryConfig {
  enabled: boolean
  dsn?: string
  release?: string
  environment?: string
}

export type SentryInitialization
  = | { _tag: 'Disabled', reason: 'disabled' | 'missing-dsn' | 'missing-release' }
    | { _tag: 'Enabled', dsn: string, release: string, environment: string }

/**
 * Local production-mode builds have no release ID. Keeping that state distinct
 * prevents Wrangler preview failures from entering the production project.
 *
 * The browser SDK reads this too. It used to gate on `import.meta.dev` alone,
 * which is false inside a local `wrangler dev` worker, so a laptop could still
 * report as production. Carrying `environment` through the same result keeps
 * that name out of the init call sites, where it was hardcoded.
 */
export function resolveSentryInitialization(config: SentryConfig): SentryInitialization {
  if (!config.enabled)
    return { _tag: 'Disabled', reason: 'disabled' }
  if (!config.dsn)
    return { _tag: 'Disabled', reason: 'missing-dsn' }
  if (!config.release)
    return { _tag: 'Disabled', reason: 'missing-release' }

  return {
    _tag: 'Enabled',
    dsn: config.dsn,
    release: config.release,
    environment: config.environment || 'production',
  }
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

/**
 * Why an async region failed, in the only terms the UI is allowed to state.
 *
 * The tag is derived from an HTTP status code, which is a number. It is never
 * derived from an error's `message`. `message` on a failed fetch is developer
 * text that quotes the request: ofetch renders `[GET] "/api/pro/sites/42/…":
 * 500 Internal Server Error`. Rendering that puts an internal route, a site id,
 * and any query string on a customer's screen. Credentials have leaked this way
 * before, so the widget layer holds no path from a wire string to the DOM.
 *
 * `unknown` covers every input this cannot place: a network drop, an abort, a
 * response-schema mismatch, a plain `Error`, `null`. Those carry no status.
 */
export type WidgetFailure
  = | { readonly _tag: 'signed-out' }
    | { readonly _tag: 'no-access' }
    | { readonly _tag: 'missing' }
    | { readonly _tag: 'rate-limited' }
    | { readonly _tag: 'rejected' }
    | { readonly _tag: 'server' }
    | { readonly _tag: 'unknown' }

export type WidgetFailureTag = WidgetFailure['_tag']

export interface WidgetFailureCopy {
  /** What happened. */
  readonly title: string
  /** What to do next. */
  readonly body: string
  /**
   * Whether retrying the same read can succeed. A retry button on a 401 or a
   * 403 is advice that cannot work, so those branches hide it.
   */
  readonly retryable: boolean
}

/**
 * The copy for every failure the UI can show.
 *
 * `satisfies Record<WidgetFailureTag, WidgetFailureCopy>` is the guard: a new
 * tag fails the typecheck here until someone writes its copy, so no failure can
 * reach a customer without one.
 */
export const WIDGET_FAILURE_COPY = {
  'signed-out': {
    title: 'Your session ended',
    body: 'Sign in again to load this data.',
    retryable: false,
  },
  'no-access': {
    title: 'Access denied',
    body: 'Ask a teammate to grant you access.',
    retryable: false,
  },
  'missing': {
    title: 'Not found',
    body: 'This data moved or was removed.',
    retryable: false,
  },
  'rate-limited': {
    title: 'Too many requests',
    body: 'Wait a moment, then retry.',
    retryable: true,
  },
  'rejected': {
    title: 'The request was rejected',
    body: 'Reload the page, then try again.',
    retryable: true,
  },
  'server': {
    title: 'The server failed',
    body: 'We logged this failure. Retry in a moment.',
    retryable: true,
  },
  'unknown': {
    title: 'This data failed to load',
    body: 'Check your connection, then retry.',
    retryable: true,
  },
} as const satisfies Record<WidgetFailureTag, WidgetFailureCopy>

/**
 * HTTP status from any error shape.
 *
 * Twin of `queryErrorStatusCode` in `layers/core/app/utils/rpc.ts`. It is copied
 * rather than imported because ADR-0042 lets `design-system` import `core` for
 * types only. Both read the same four fields; keep them in step.
 */
function statusCodeOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object')
    return undefined
  const e = error as {
    statusCode?: unknown
    status?: unknown
    data?: { statusCode?: unknown }
    response?: { status?: unknown }
  }
  const candidate = [e.statusCode, e.status, e.data?.statusCode, e.response?.status]
    .find(value => typeof value === 'number')
  return typeof candidate === 'number' ? candidate : undefined
}

/**
 * Parse an arbitrary caught value once, at the widget boundary, into the tag the
 * template trusts. Everything inward of this function is safe to render.
 */
export function toWidgetFailure(error: unknown): WidgetFailure {
  const status = statusCodeOf(error)
  if (status === 401)
    return { _tag: 'signed-out' }
  if (status === 403)
    return { _tag: 'no-access' }
  if (status === 404)
    return { _tag: 'missing' }
  if (status === 429)
    return { _tag: 'rate-limited' }
  if (status !== undefined && status >= 400 && status < 500)
    return { _tag: 'rejected' }
  if (status !== undefined && status >= 500)
    return { _tag: 'server' }
  return { _tag: 'unknown' }
}

export function widgetFailureCopy(error: unknown): WidgetFailureCopy {
  return WIDGET_FAILURE_COPY[toWidgetFailure(error)._tag]
}

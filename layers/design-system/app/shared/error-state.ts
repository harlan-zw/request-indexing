import type { UiIcon } from './ui-icons'
import { toWidgetFailure, WIDGET_FAILURE_COPY } from './widget-failure'

/**
 * What `UiErrorState` is allowed to say, and where the words came from.
 *
 * The old prop was `string | { message: string }`. Both arms rendered their
 * string, so a caught query error and a hand-written sentence were the same
 * type. Six pro pages passed the caught error, and ofetch writes the request
 * into `message`: `[GET] "/api/pro/v1/sites/<id>/search/status": 500 Internal
 * Server Error`. That put an internal route and a site id on a customer's
 * screen, and credentials have reached error strings the same way before.
 *
 * The tag now records provenance, which is the thing the two arms never agreed
 * on. A `wire` value is a caught object. It is typed `unknown`, so no template
 * can read a string off it; only the HTTP status code is read, and only to pick
 * copy this file owns. A `copy` value is a sentence the caller wrote, which is
 * safe to render because a person chose the words.
 *
 * A caller can no longer pass a caught error where copy is expected: the free
 * tools keep rendering their own vetted copy through `errorCopy`, and a pro
 * page must say `wireError` and accept classified copy instead.
 */
export type ErrorStateSource
  = | { readonly _tag: 'wire', readonly error: unknown }
    | { readonly _tag: 'copy', readonly title: string, readonly detail?: string }
    | {
      readonly _tag: 'rate-limited'
      readonly detail: string
      readonly resetAt?: Date
      readonly retryAfter?: number
    }

/**
 * Classify a caught value. The component reads its status code and nothing else.
 *
 * Pass the raw error. Wrapping it in `new Error(someMessage)` throws away the
 * status code the classifier needs and buys no safety.
 */
export function wireError(error: unknown): ErrorStateSource {
  return { _tag: 'wire', error }
}

/**
 * Render a sentence the caller wrote. Use it for copy a person authored.
 *
 * Never pass an error's `message` through here. Use `wireError` for a caught
 * value, so the status code picks the copy.
 */
export function errorCopy(title: string, detail?: string): ErrorStateSource {
  return { _tag: 'copy', title, detail }
}

/**
 * A quota refusal the caller already parsed, with the reset it read from the
 * response headers. `wireError` covers a 429 too, but it cannot state a reset
 * time, because a status code carries none.
 */
export function rateLimited(
  detail: string,
  reset?: { resetAt?: Date, retryAfter?: number },
): ErrorStateSource {
  return { _tag: 'rate-limited', detail, resetAt: reset?.resetAt, retryAfter: reset?.retryAfter }
}

/**
 * The next-step line under the message.
 *
 * Tagged because the two kinds behave differently: a `timing` line states a
 * real reset the caller measured and always shows, while a `generic` line is
 * filler that an `#action` slot replaces with something better.
 */
export type ErrorStateNextStep
  = | { readonly _tag: 'timing', readonly text: string }
    | { readonly _tag: 'generic', readonly text: string }

/** Everything the template renders. No field holds a caught value. */
export interface ErrorStateView {
  readonly tone: 'error' | 'warning'
  readonly icon: UiIcon
  /** What happened. */
  readonly title: string
  /** What to do about it, when the failure is specific enough to say. */
  readonly detail: string | null
  readonly nextStep: ErrorStateNextStep | null
  /** Whether retrying the same request can succeed. */
  readonly retryable: boolean
}

const GENERIC_NEXT_STEP = 'Try again in a moment. If it keeps happening, contact support.'

function resetHint(source: { resetAt?: Date, retryAfter?: number }, now: number): string | null {
  if (source.retryAfter)
    return `Try again in ${source.retryAfter} seconds`

  if (!source.resetAt)
    return null

  const remaining = source.resetAt.getTime() - now
  if (remaining <= 0)
    return null
  if (remaining < 60_000)
    return `Resets in ${Math.ceil(remaining / 1000)} seconds`
  if (remaining < 3_600_000)
    return `Resets in ${Math.ceil(remaining / 60_000)} minutes`
  return 'Resets at midnight UTC'
}

/**
 * Turn a source into the words on screen. Pure: pass the clock in, so the
 * reset hint is testable and the component owns no time.
 */
export function resolveErrorState(source: ErrorStateSource, now: number): ErrorStateView {
  if (source._tag === 'copy') {
    return {
      tone: 'error',
      icon: 'caution',
      title: source.title,
      detail: source.detail ?? null,
      nextStep: { _tag: 'generic', text: GENERIC_NEXT_STEP },
      retryable: true,
    }
  }

  if (source._tag === 'rate-limited') {
    const hint = resetHint(source, now)
    return {
      tone: 'warning',
      icon: 'clock',
      title: WIDGET_FAILURE_COPY['rate-limited'].title,
      detail: source.detail,
      nextStep: hint
        ? { _tag: 'timing', text: hint }
        : { _tag: 'generic', text: WIDGET_FAILURE_COPY['rate-limited'].body },
      retryable: true,
    }
  }

  const failure = toWidgetFailure(source.error)
  const copy = WIDGET_FAILURE_COPY[failure._tag]
  const limited = failure._tag === 'rate-limited'
  return {
    tone: limited ? 'warning' : 'error',
    icon: limited ? 'clock' : 'caution',
    title: copy.title,
    detail: copy.body,
    nextStep: null,
    retryable: copy.retryable,
  }
}

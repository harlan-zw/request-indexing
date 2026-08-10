import type { H3Event } from 'h3'
import type { NitroRuntimeHooks } from 'nitropack/types'

type ProHookName = Extract<keyof NitroRuntimeHooks, `pro:${string}`>
type ProHookPayload<K extends ProHookName> = Parameters<NitroRuntimeHooks[K]>[0]

type ProHookNameWithEvent = {
  [K in ProHookName]: ProHookPayload<K> extends { event: H3Event } ? K : never
}[ProHookName]

type ProTaskHookName = Exclude<ProHookName, ProHookNameWithEvent>

/**
 * Typed dispatcher for `pro:*` Nitro runtime hooks fired from an HTTP request.
 * Auto-fills `event`; the caller supplies the rest of the payload. Use this
 * from server routes/utils instead of `nitroApp.hooks.callHook('pro:...', ...)`
 * — payloads are checked against the `NitroRuntimeHooks` augmentation in
 * `./hooks.ts`.
 */
export async function dispatchProEvent<K extends ProHookNameWithEvent>(
  event: H3Event,
  name: K,
  payload: Omit<ProHookPayload<K>, 'event'>,
): Promise<void> {
  const nitroApp = useNitroApp()
  // Cast through unknown: the dynamic generic `K` defeats Nitro's hook overload
  // narrowing, but the public `Omit<ProHookPayload<K>, 'event'>` parameter
  // already enforces correctness at the call site.
  await (nitroApp.hooks.callHook as unknown as (n: K, p: ProHookPayload<K>) => Promise<void>)(name, { event, ...payload } as ProHookPayload<K>)
}

/**
 * Task-context variant of {@link dispatchProEvent} for hooks fired from a
 * scheduled task or background runner where no `H3Event` is in scope (e.g.
 * `pro:perf:scan-complete` from the Lighthouse orchestrator).
 */
export async function dispatchProTaskEvent<K extends ProTaskHookName>(
  name: K,
  payload: ProHookPayload<K>,
): Promise<void> {
  const nitroApp = useNitroApp()
  await (nitroApp.hooks.callHook as unknown as (n: K, p: ProHookPayload<K>) => Promise<void>)(name, payload)
}

/**
 * Parallel-fan-out variant for hooks with multiple independent listeners
 * (e.g. `pro:site:added` — autolink GSC, screenshot, profile, competitors all
 * run concurrently). Returns the unsettled promise so the caller can pass it
 * to `waitUntil` and let listeners outlive the response per ADR-0007.
 *
 * Listener errors are NOT surfaced; each listener is responsible for its own
 * try/catch and logging. Wrap the returned promise in `.catch()` only to log
 * the aggregate failure mode.
 */
export function dispatchProEventParallel<K extends ProHookNameWithEvent>(
  event: H3Event,
  name: K,
  payload: Omit<ProHookPayload<K>, 'event'>,
): Promise<void> {
  const nitroApp = useNitroApp()
  return (nitroApp.hooks.callHookParallel as unknown as (n: K, p: ProHookPayload<K>) => Promise<void>)(name, { event, ...payload } as ProHookPayload<K>)
}

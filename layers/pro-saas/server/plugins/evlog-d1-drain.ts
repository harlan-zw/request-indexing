// Server-side D1 sink for the `logWarn`/`logError` chokepoint in
// `shared/logging/`. Every structured log entry with a catalogued `name`
// gets persisted into `runtime_errors` so `/admin/runtime-errors` can show
// what we're swallowing in production.
//
// Sink path (not evlog drain hook): the evlog drain fires *once per
// request* with the aggregate wide event, but our pattern emits many
// independent best-effort warnings per request. The sink in
// `shared/logging/index.ts` is the right seam — each `logWarn` call flows
// straight through.
//
// Lifetime extension: on Cloudflare Workers, the isolate can be terminated
// the moment the response is sent. Without `ctx.waitUntil`, an in-flight
// D1 insert dies with the response and we lose the log row. We pull the
// current request's `cloudflare.context.waitUntil` via `useEvent()` (nitro
// async-context) and hand the promise to it so the worker stays alive
// until the insert resolves. Outside a request (cron tasks, background
// queues), `useEvent()` returns undefined and we fall back to a bare
// awaited promise — the task runner is already keeping the isolate alive.
//
// Best-effort: insert errors are caught to stderr so a D1 outage cannot
// poison the request lifecycle that triggered the original log.

import { setLogSink } from '~~/shared/logging'
import { runtimeErrors } from '#layers/pro-saas/server/database'

function toJsonString(value: unknown): string | null {
  if (value == null)
    return null
  try {
    return JSON.stringify(value)
  }
  catch {
    return null
  }
}

export default defineNitroPlugin(() => {
  if (import.meta.prerender)
    return

  setLogSink((entry) => {
    // Capture the current event synchronously — `useEvent()` reads from
    // async-context that the catch handler's parent still owns, but only
    // before we hop to a microtask.
    const event = (() => {
      try {
        return useEvent()
      }
      catch {
        // Outside a request (cron, init): no event, no waitUntil.
        return null
      }
    })()
    const waitUntil = event?.context?.cloudflare?.context?.waitUntil?.bind(event.context.cloudflare.context)

    const promise = (async () => {
      try {
        const db = useDrizzle(event ?? undefined)
        await db.insert(runtimeErrors).values({
          createdAt: Date.now(),
          level: entry.level,
          name: entry.name,
          description: entry.description,
          error: toJsonString(entry.error),
          ctx: toJsonString(entry.ctx),
          requestId: (event?.context as { requestId?: string } | undefined)?.requestId ?? null,
          userId: (entry.ctx?.userId as string | undefined) ?? null,
          path: (entry.ctx?.path as string | undefined) ?? event?.path ?? null,
        })
      }
      catch (err) {
        console.error('[evlog-d1-drain] insert failed', err)
      }
    })()

    if (waitUntil)
      waitUntil(promise)
    else
      void promise
  })
})

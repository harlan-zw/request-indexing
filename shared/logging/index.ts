// Single chokepoint for the "best-effort failure" pattern. See ADR-0022.
//
// Usage:
//
//   import { logWarn } from '~~/shared/logging'
//   .catch(err => logWarn('agency_overage.meter_failed', err, { customerId }))
//
// Pipeline:
//   1. `log.warn` from evlog → dev pretty-print + Sentry/Axiom adapters.
//   2. A `LogSink` (registered server-side by `layers/pro-saas/server/plugins/evlog-d1-drain.ts`)
//      receives the structured record and persists it to the `runtime_errors`
//      D1 table. Client-side the sink is unregistered, so logs only land in
//      the browser console + any client transport configured on evlog.
//
// The sink seam is what lets the same call site work in both runtime graphs
// without `shared/` knowing about D1, Drizzle, or H3.

import type { LogName } from './catalog'
import { LOG_CATALOG } from './catalog'

// Local shim for evlog (package not yet installed). Mirrors the surface used
// below: `log.warn(payload)`, `log.error(payload)`, and `parseError(err)`.
const log = {
  warn: (payload: unknown) => console.warn('[evlog:warn]', payload),
  error: (payload: unknown) => console.error('[evlog:error]', payload),
}
function parseError(error: unknown): { message: string, stack?: string } {
  if (error instanceof Error)
    return { message: error.message, stack: error.stack }
  return { message: String(error) }
}

export { LOG_CATALOG }
export type { LogName }

export interface LogSinkEntry {
  level: 'warn' | 'error'
  name: LogName
  description: string
  error: ReturnType<typeof parseError> | null
  ctx: Record<string, unknown> | null
}

export type LogSink = (entry: LogSinkEntry) => void

let installedSink: LogSink | null = null

export function setLogSink(sink: LogSink | null): void {
  installedSink = sink
}

function emit(level: 'warn' | 'error', name: LogName, error: unknown, ctx?: Record<string, unknown>): void {
  const parsed = error == null ? null : parseError(error)
  const description = LOG_CATALOG[name]

  // evlog pipeline: dev pretty-print + external drains (Sentry, etc.).
  log[level]({
    name,
    description,
    error: parsed,
    ...(ctx ? { ctx } : {}),
  })

  // Server-installed sink (D1). Wrapped so a misbehaving sink can never
  // re-enter the catch path that called us.
  if (installedSink) {
    try {
      installedSink({ level, name, description, error: parsed, ctx: ctx ?? null })
    }
    catch (sinkErr) {
      console.error('[logging] sink threw', sinkErr)
    }
  }
}

export function logWarn(name: LogName, error: unknown, ctx?: Record<string, unknown>): void {
  emit('warn', name, error, ctx)
}

export function logError(name: LogName, error: unknown, ctx?: Record<string, unknown>): void {
  emit('error', name, error, ctx)
}

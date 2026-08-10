import type { Ref } from 'vue'
import type { GscQueryDecision, GscQueryDecisionReason } from './useGscQuery'
import { logWarn } from '~~/shared/logging'

type ReasonCounts = Partial<Record<GscQueryDecisionReason, number>>

export interface GscEngineLogEntry {
  id: number
  ts: number
  engine: 'browser' | 'server' | 'fallback'
  elapsedMs: number | null
  reason?: string
  detail?: string
}

interface EngineStats {
  browser: number
  server: number
  fallback: number
  lastEngine: 'browser' | 'server' | null
  lastElapsedMs: number | null
  lastFallbackReason: string | null
  lastDecision: GscQueryDecision | null
  reasons: ReasonCounts
  logs: GscEngineLogEntry[]
}

const LOG_LIMIT = 50
let logSeq = 0
function pushLog(stats: Ref<EngineStats>, entry: Omit<GscEngineLogEntry, 'id' | 'ts'>) {
  const next = [
    { id: ++logSeq, ts: Date.now(), ...entry },
    ...(stats.value.logs ?? []),
  ].slice(0, LOG_LIMIT)
  stats.value = { ...stats.value, logs: next }
}

interface TrackedQuery {
  engine: Ref<'browser' | 'server' | null>
  elapsedMs: Ref<number | null>
  fallbackReason: Ref<string | null>
  lastDecision?: Ref<GscQueryDecision>
}

export function useGscEngineStats() {
  return useState<EngineStats>('gsc-engine-stats', () => ({
    browser: 0,
    server: 0,
    fallback: 0,
    lastEngine: null,
    lastElapsedMs: null,
    lastFallbackReason: null,
    lastDecision: null,
    reasons: {},
    logs: [],
  }))
}

export function useLogGscEngine(entry: Omit<GscEngineLogEntry, 'id' | 'ts'>) {
  if (!import.meta.client || !import.meta.dev)
    return
  pushLog(useGscEngineStats(), entry)
}

export function useTrackGscEngine(query: TrackedQuery) {
  if (!import.meta.client)
    return
  // Telemetry on the fast-path failing is always-on — a paying R2 user
  // silently falling back to cloud is the failure mode we most want to see.
  watch(query.fallbackReason, (reason) => {
    if (!reason)
      return
    logWarn('gscdump.engine.fallback', new Error(`browser engine fell back: ${reason}`), { reason })
  })
  // Dev-only aggregate counters drive the ProGscEngineDevPill.
  if (!import.meta.dev)
    return
  const stats = useGscEngineStats()
  watch(query.engine, (engine) => {
    if (!engine)
      return
    stats.value = {
      ...stats.value,
      [engine]: stats.value[engine] + 1,
      lastEngine: engine,
      lastElapsedMs: query.elapsedMs.value,
    }
    pushLog(stats, { engine, elapsedMs: query.elapsedMs.value })
  })
  watch(query.fallbackReason, (reason) => {
    if (!reason)
      return
    stats.value = {
      ...stats.value,
      fallback: stats.value.fallback + 1,
      lastFallbackReason: reason,
    }
    pushLog(stats, { engine: 'fallback', elapsedMs: null, reason })
  })
  if (query.lastDecision) {
    watch(query.lastDecision, (decision) => {
      if (!decision || decision.reason === 'idle' || decision.reason === 'ssr' || decision.reason === 'disabled')
        return
      const reasons = { ...stats.value.reasons }
      reasons[decision.reason] = (reasons[decision.reason] ?? 0) + 1
      stats.value = {
        ...stats.value,
        lastDecision: decision,
        reasons,
      }
    }, { deep: true })
  }
}

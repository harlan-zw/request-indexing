import type { AnalysisParams, AnalysisResult } from '@gscdump/engine/analysis-types'
import { useGscEngineStats, useLogGscEngine } from '../useGscEngineStats'

/**
 * Returns the historical `analyzeWithFallback` signature while routing its
 * work through the consumer-owned hosted operation.
 *
 * The retired `@gscdump/nuxt-analytics` layer owned the browser analyzer. v1
 * has no implicit analyzer endpoint, so imperative callers now use only their
 * explicit server fallback and cannot silently cross onto a legacy surface.
 *
 * Must be called in setup context.
 */
export function useProAnalyzeWithFallback() {
  const stats = (import.meta.client && import.meta.dev) ? useGscEngineStats() : null
  function bumpEngine(engine: 'browser' | 'server', elapsedMs: number, detail?: string) {
    if (!stats)
      return
    stats.value = {
      ...stats.value,
      [engine]: stats.value[engine] + 1,
      lastEngine: engine,
      lastElapsedMs: elapsedMs,
    }
    useLogGscEngine({ engine, elapsedMs, detail })
  }
  return async function analyzeWithFallback<T>(
    siteId: string,
    _params: AnalysisParams,
    _reshape: (raw: AnalysisResult) => T,
    serverFallback: () => Promise<T>,
  ): Promise<T> {
    const startedAt = (import.meta.client && import.meta.dev) ? performance.now() : 0
    const output = await serverFallback()
    bumpEngine('server', (import.meta.client && import.meta.dev) ? performance.now() - startedAt : 0, siteId)
    return output
  }
}

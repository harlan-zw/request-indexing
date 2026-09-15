import type { GscdumpMeta } from '@gscdump/contracts'
import { useState } from 'nuxt/app'
import { onScopeDispose } from 'vue'

/**
 * Poll once for an on-demand backfill.
 *
 * A response can declare that the requested range ran past the synced history.
 * gscdump starts the backfill itself, so the table only has to come back and
 * ask again. One timer per site is shared across every table on the page, so a
 * page with three tables triggers one refresh, not three.
 */
export function useGscBackfill() {
  const pollingSites = useState<Set<string>>('pro-gsc:backfill:polling', () => new Set<string>())
  const ownedTimers = new Map<string, number>()

  function maybeTrigger(meta: GscdumpMeta | null | undefined, siteId: string, refresh: () => void | Promise<void>) {
    if (typeof window === 'undefined')
      return

    const percent = meta?.backfill?.percent
    if (percent == null || percent >= 100 || pollingSites.value.has(siteId))
      return

    pollingSites.value.add(siteId)
    const timer = window.setTimeout(async () => {
      if (ownedTimers.get(siteId) !== timer)
        return
      // Once fired, the refresh cannot be cancelled through this timer. Keep
      // the shared site lock until the refresh settles, but stop treating it as
      // a pending timer owned by this scope.
      ownedTimers.delete(siteId)
      try {
        await refresh()
      }
      finally {
        pollingSites.value.delete(siteId)
      }
    }, 10_000)
    ownedTimers.set(siteId, timer)
  }

  onScopeDispose(() => {
    for (const [siteId, timer] of ownedTimers) {
      window.clearTimeout(timer)
      pollingSites.value.delete(siteId)
    }
    ownedTimers.clear()
  })

  return { maybeTrigger }
}

import type { MaybeRefOrGetter, Ref } from 'vue'
import { computed, onScopeDispose, ref, toValue, watch } from 'vue'
import { logWarn } from '~~/shared/logging'
import { operatorFreeKeyword } from '../../../shared/search-operator-queries'
import { useProGscdump } from './useProGscdump'

/**
 * Resolve the top associated entity for a table page: the top page for each
 * query, or the top query for each page.
 *
 * The `top-association` operation answers one identifier per call, so the reads
 * are issued with a bounded concurrency and cached per key. A key already
 * resolved for the current site and window is never requested again, so paging
 * through a load-more table costs only the newly visible rows.
 *
 * Resolution is per key, not per table page. A single pending flag over the
 * whole batch kept every cell in its loading state until the slowest of 25
 * reads returned, which is why the column read as permanently blank; a cell now
 * settles the moment its own read lands.
 */
export interface UseProTopAssociationsOptions {
  gscdumpSiteId: MaybeRefOrGetter<string | null | undefined>
  range: MaybeRefOrGetter<{ start: string, end: string }>
  /** Dimension the table rows are keyed by. The top of the other is returned. */
  group: 'query' | 'queryCanonical' | 'page'
  /** Visible row keys. */
  keys: MaybeRefOrGetter<readonly string[]>
  /** Requests in flight at once. */
  concurrency?: number
}

async function forEachWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0
  async function worker() {
    while (cursor < items.length)
      await fn(items[cursor++]!)
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
}

export function useProTopAssociations(opts: UseProTopAssociationsOptions): {
  map: Ref<Map<string, string>>
  pending: Ref<boolean>
  /** True only while this key's own read is in flight. */
  pendingFor: (key: string) => boolean
} {
  const gscdump = useProGscdump()
  const map = ref<Map<string, string>>(new Map())
  const unresolved = ref<Set<string>>(new Set())
  const pending = computed(() => unresolved.value.size > 0)
  // Grouping by a query dimension returns the top page, and the reverse.
  const associationType = opts.group === 'page' ? 'topKeyword' : 'topPage'
  const concurrency = opts.concurrency ?? 4
  const cached = new Map<string, string | null>()
  let cacheScope = ''

  const _keys = computed(() => {
    const seen = new Set<string>()
    for (const k of toValue(opts.keys)) {
      if (k)
        seen.add(k)
    }
    return [...seen]
  })

  function publish(keys: readonly string[]): void {
    const next = new Map<string, string>()
    for (const key of keys) {
      const value = cached.get(key)
      if (value)
        next.set(key, value)
    }
    map.value = next
  }

  function settle(key: string): void {
    if (!unresolved.value.has(key))
      return
    const next = new Set(unresolved.value)
    next.delete(key)
    unresolved.value = next
  }

  let token = 0
  onScopeDispose(() => token++)
  watch(
    [() => toValue(opts.gscdumpSiteId), () => toValue(opts.range), _keys],
    async ([siteId, range, keys]) => {
      const current = ++token
      const nextScope = siteId ? `${siteId}:${range?.start}:${range?.end}:${opts.group}` : ''
      if (nextScope !== cacheScope) {
        cached.clear()
        cacheScope = nextScope
      }
      if (!import.meta.client || !siteId || !keys.length || !range?.start || !range?.end) {
        map.value = new Map()
        unresolved.value = new Set()
        return
      }
      const missing = keys.filter(k => !cached.has(k))
      publish(keys)
      unresolved.value = new Set(missing)
      if (!missing.length)
        return

      await forEachWithConcurrency(missing, concurrency, async (identifier) => {
        const data = await gscdump.getTopAssociation<{ value: string | null }>({
          params: { siteId },
          query: { type: associationType, identifier, startDate: range.start, endDate: range.end },
          // Silent: an unresolved association renders as a dash in its own
          // cell, which says more than a toast over the whole table. The
          // failure is still logged rather than dropped.
        }, true).catch((cause: unknown) => {
          logWarn('gscdump.table_cell.unresolved', cause, { read: 'top-association', type: associationType, identifier })
          return null
        })
        if (current !== token)
          return
        // An operator string is not a ranking, so it must never be offered as
        // a page's top keyword.
        const value = data?.value ?? null
        cached.set(identifier, associationType === 'topKeyword' ? operatorFreeKeyword(value) : value)
        publish(keys)
        settle(identifier)
      })
      if (current !== token)
        return
      unresolved.value = new Set()
    },
    { immediate: true, deep: true },
  )

  return { map, pending, pendingFor: (key: string) => unresolved.value.has(key) }
}

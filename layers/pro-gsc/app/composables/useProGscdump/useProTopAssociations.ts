import type { MaybeRefOrGetter, Ref } from 'vue'
import { computed, onScopeDispose, ref, toValue, watch } from 'vue'
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

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = Array.from({ length: items.length })
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      out[index] = await fn(items[index]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

export function useProTopAssociations(opts: UseProTopAssociationsOptions): {
  map: Ref<Map<string, string>>
  pending: Ref<boolean>
} {
  const gscdump = useProGscdump()
  const map = ref<Map<string, string>>(new Map())
  const pending = ref(false)
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
        pending.value = false
        return
      }
      const missing = keys.filter(k => !cached.has(k))
      if (missing.length) {
        pending.value = true
        const results = await mapWithConcurrency(missing, concurrency, async (identifier) => {
          const data = await gscdump.getTopAssociation<{ value: string | null }>({
            params: { siteId },
            query: { type: associationType, identifier, startDate: range.start, endDate: range.end },
            // Silent: an unresolved association renders as a dash in its own
            // cell, which says more than a toast over the whole table.
          }, true).catch(() => null)
          return [identifier, data?.value ?? null] as const
        })
        if (current !== token)
          return
        for (const [key, value] of results) {
          // An operator string is not a ranking, so it must never be offered as
          // a page's top keyword.
          cached.set(key, associationType === 'topKeyword' ? operatorFreeKeyword(value) : value)
        }
      }
      const next = new Map<string, string>()
      for (const k of keys) {
        const v = cached.get(k)
        if (v)
          next.set(k, v)
      }
      map.value = next
      pending.value = false
    },
    { immediate: true, deep: true },
  )

  return { map, pending }
}

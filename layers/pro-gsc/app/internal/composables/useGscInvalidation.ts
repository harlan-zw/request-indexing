// Per-site invalidation tokens for in-tab live refresh.
//
// The realtime plugin (`05.gscdump-realtime.client.ts`) bumps a site's token
// when gscdump.com fires `sync.site_complete` / `sync.complete` /
// `enrichment.complete`. `useProGscdump*` composables pass the token into
// `useGscQuery`'s `watchSources`, so any mounted query re-runs against fresh
// data without a page reload.
//
// Token == 0 means "no invalidation seen for this site this session" — fine
// as initial value; useGscQuery's `immediate: true` watcher fires once on
// mount anyway, so a 0 → 1 transition triggers exactly one extra refetch.

import type { MaybeRefOrGetter } from '@vue/runtime-core'
import type { ComputedRef, Ref } from 'vue'

type InvalidationMap = Record<string, number>

export function useGscInvalidationMap(): Ref<InvalidationMap> {
  return useState<InvalidationMap>('gsc-invalidation', () => ({}))
}

export function bumpGscInvalidation(siteId: string): void {
  const map = useGscInvalidationMap()
  map.value = { ...map.value, [siteId]: (map.value[siteId] ?? 0) + 1 }
}

export function useGscSiteInvalidation(
  siteId: MaybeRefOrGetter<string | null | undefined>,
): ComputedRef<number> {
  const map = useGscInvalidationMap()
  return computed(() => {
    const id = toValue(siteId)
    return id ? (map.value[id] ?? 0) : 0
  })
}

import type { WatchSource } from 'vue'
import { useProGscdump } from './useProGscdump'

export interface GscdumpQueryOptions {
  immediate?: boolean
  watch?: boolean
}

/**
 * Factory for v1 gscdump useAsyncData queries (indexing, sitemaps).
 *
 * Indexing and sitemap callers receive the typed client so public operations
 * cannot fall back to legacy path strings.
 */
export function useGscdumpQuery<T>(
  key: MaybeRefOrGetter<string>,
  siteId: MaybeRefOrGetter<string | undefined>,
  fn: (siteId: string, gscdump: ReturnType<typeof useProGscdump>) => Promise<T>,
  watchSources: WatchSource[],
  options?: GscdumpQueryOptions,
) {
  const _siteId = computed(() => toValue(siteId))
  const gscdump = useProGscdump()
  const shouldWatch = options?.watch ?? true
  return useAsyncData<T>(key, async () => {
    if (!_siteId.value)
      return null as unknown as T
    return fn(_siteId.value, gscdump)
  }, {
    server: false,
    immediate: options?.immediate ?? true,
    ...(shouldWatch ? { watch: [_siteId, ...watchSources] } : {}),
  })
}

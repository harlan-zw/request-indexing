import type { Ref } from 'vue'
import { navigateTo, useCookie, useRoute, useState } from 'nuxt/app'
import { nextTick, watch } from 'vue'
import { useProFilterStore } from './useProFilterStore'

// URL plus cookie synced filter primitive: URL query, then persisted value,
// then default.
//
// Persistence goes through `useProFilterStore`, a single bounded cookie. The
// server can read a cookie, so the value is correct on the first render and
// never changes after mount. That property is the point of this primitive: a
// filter that settled post-hydration made every watcher over it fire twice,
// which doubled the API traffic of the per-site fan-outs.
//
// If you add a new persisted filter, persist it through the store. Do not reach
// for localStorage: it cannot be read during SSR, so it reintroduces the
// post-mount change this design removes.
//
// Ported from nuxtseo.com `layers/pro/sites/app/composables/useProUrlSyncedFilter.ts`.

export function queryStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

export function useProUrlSyncedFilter<T extends string | number>(
  queryKey: string,
  storageKey: string,
  defaultValue: T,
  opts?: {
    // Named `parse` and `serialize`, NOT `fromString` and `toString`. An option
    // named `toString` collides with `Object.prototype.toString`, so
    // `opts?.toString` reads the inherited method (always truthy) and silently
    // serializes every value to "[object Undefined]".
    parse?: (s: string) => T
    serialize?: (v: T) => string
    /**
     * Clamp externally sourced values (URL query, persisted store) to a known
     * good set. A persisted enum that has since been renamed otherwise flows
     * straight through and breaks a downstream lookup with no error.
     */
    sanitize?: (v: T) => T
  },
): Ref<T> {
  const route = useRoute()
  const store = useProFilterStore()
  const fromStr = opts?.parse ?? (s => s as T)
  const toStr = opts?.serialize ?? (v => String(v))
  const sanitize = opts?.sanitize ?? (v => v)

  const rawQuery = queryStringValue(route.query[queryKey])
  // The URL query is the shareable source of truth, so it wins over the
  // persisted value. Both are readable during SSR, so this resolves to the same
  // value on the server and on the client.
  const initial = sanitize(rawQuery ? fromStr(rawQuery) : store.read<T>(storageKey, defaultValue))
  const value = useState<T>(`pro-filter:${storageKey}`, () => initial)
  // Suppresses the value to URL write when a change comes from a passive
  // restore (back/forward) rather than a user action.
  let skipUrlSync = false

  // Cookies this primitive used to persist to, one per filter, at path '/'.
  // They now ride every request including asset requests, so expire them. This
  // touches no filter value, so it cannot trigger a refetch.
  if (import.meta.client) {
    const legacyCookie = useCookie<T | null>(storageKey.replace(/:/g, '-'), { path: '/', default: () => null })
    if (legacyCookie.value != null)
      legacyCookie.value = null
  }

  watch(() => queryStringValue(route.query[queryKey]), (raw) => {
    const resolved = sanitize(raw ? fromStr(raw) : store.read<T>(storageKey, defaultValue))
    if (resolved !== value.value) {
      skipUrlSync = true
      value.value = resolved
      nextTick(() => {
        skipUrlSync = false
      })
    }
  })

  // Sanitize on the way out too, not just on read: an invalid value reaching
  // this watch must never serialize into the shareable URL. A valid member
  // passes `sanitize` unchanged, so genuine selections are never altered.
  watch(value, (val) => {
    const clean = sanitize(val)
    store.write(storageKey, clean)
    if (skipUrlSync)
      return
    const isDefault = clean === defaultValue
    const newQuery = { ...route.query, [queryKey]: isDefault ? undefined : toStr(clean) }
    navigateTo({ query: newQuery }, { replace: true })
  })

  return value
}

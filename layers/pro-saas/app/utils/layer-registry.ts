import type { Ref, ShallowRef } from 'vue'
import type { RuntimeNuxtHooks } from '#app'

// Generic registry primitive used by Nuxt Layer Hooks that fan out across
// layers. Each layer contributes by registering a listener on the named
// hook; the first consumer call to `useLayerRegistry(stateKey, hookName)`
// fires the hook (synchronously fanning out to all registered listeners)
// and caches the result in `useState(stateKey)` for the rest of the app
// lifetime.
//
// The lazy-on-read pattern means contributor plugins do NOT need to run
// before the registry — they only need to register their listener before
// the first consumer reads. Since consumers always read from page/component
// setup (which runs after every plugin's setup), late registration is
// impossible by construction. See ADR-0010.
//
// Used by `useOnboardingFlow` and `useSiteSurfaceRegistry`.

import { computed, shallowRef } from 'vue'

interface RegistryEntry { id: string, priority: number }

export interface LayerRegistry<T extends RegistryEntry> {
  add: (entry: T) => void
}

export interface LayerRegistryView<T extends RegistryEntry> {
  items: Readonly<Ref<readonly T[]>>
  sorted: ComputedRef<T[]>
  getById: (id: string | null | undefined) => T | undefined
}

type LayerRegistryHookName<T extends RegistryEntry> = {
  [K in keyof RuntimeNuxtHooks]: RuntimeNuxtHooks[K] extends (registry: LayerRegistry<T>, ...args: never[]) => unknown ? K : never
}[keyof RuntimeNuxtHooks]

type LayerRegistryHookCaller<T extends RegistryEntry> = (
  hookName: LayerRegistryHookName<T>,
  registry: LayerRegistry<T>,
) => Promise<void>

/**
 * Build a mutable registry object that warns on duplicate ids and collects
 * entries into a backing array. Returned as `{ registry, entries }` — pass
 * `registry` to listeners; read `entries` after the hook resolves.
 */
export function createLayerRegistry<T extends RegistryEntry>(label: string): { registry: LayerRegistry<T>, entries: T[] } {
  const entries: T[] = []
  const seen = new Set<string>()
  const registry: LayerRegistry<T> = {
    add(entry) {
      if (seen.has(entry.id)) {
        console.warn(`[${label}] duplicate id "${entry.id}" — ignored`)
        return
      }
      seen.add(entry.id)
      entries.push(markRaw(entry))
    },
  }
  return { registry, entries }
}

/**
 * Read-only view over a lazily-populated layer registry. On the first call,
 * fires `hookName` against all currently-registered listeners and freezes
 * the result in `useState(stateKey)`. Subsequent calls reuse the frozen
 * state. Listeners are assumed synchronous (they only `registry.add(...)`);
 * the returned Promise from `callHook` is intentionally not awaited.
 */
export function useLayerRegistry<T extends RegistryEntry>(stateKey: string, hookName: LayerRegistryHookName<T>): LayerRegistryView<T> {
  // Entries may hold Vue component definitions (functions), which devalue
  // cannot serialize — so we cannot use `useState` here. Cache on `nuxtApp`
  // per-request instead; `shallowRef` skips deep reactivity, and `markRaw`
  // on each entry prevents Vue from trying to make components reactive.
  const nuxtApp = useNuxtApp()
  const cacheKey = `__layerRegistry:${stateKey}` as const
  let items = (nuxtApp as any)[cacheKey] as ShallowRef<T[]> | undefined
  if (!items) {
    const { registry, entries } = createLayerRegistry<T>(stateKey)
    try {
      const callLayerRegistryHook = nuxtApp.callHook as unknown as LayerRegistryHookCaller<T>
      callLayerRegistryHook(hookName, registry)
    }
    catch (e) {
      console.warn(`[${stateKey}] contributor threw during fan-out`, e)
    }
    items = shallowRef(entries)
    ;(nuxtApp as any)[cacheKey] = items
  }
  const sorted = computed(() => [...items!.value].sort((a, b) => a.priority - b.priority))
  function getById(id: string | null | undefined): T | undefined {
    if (!id)
      return undefined
    return items!.value.find(e => e.id === id)
  }
  return { items: items as Readonly<Ref<readonly T[]>>, sorted, getById }
}

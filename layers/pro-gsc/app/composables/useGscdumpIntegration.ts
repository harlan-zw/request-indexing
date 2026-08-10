// Lazy gscdump integration credentials. The owner of "what API key + analyzer
// settings this user has on gscdump.com." Lives in pro-gsc rather than on
// Caller (per ADR-0002). Hydrated from SSR payload via the useFetch key, so
// first-render reads are race-free.

import { logWarn } from '~~/shared/logging'

export interface GscdumpIntegration {
  apiKey: string | null
  userId: string | null
  apiBase: string
  browserAnalyzerEnabled: boolean
}

/** SSR payload + useNuxtData key. Plugins must read via this constant, not a duplicated literal. */
export const GSCDUMP_INTEGRATION_KEY = 'app:gscdump-integration'

export function useGscdumpIntegration() {
  const { data, refresh, error, status } = useFetch<GscdumpIntegration | null>('/api/pro/gscdump-integration', {
    key: GSCDUMP_INTEGRATION_KEY,
    server: true,
    deep: false,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  })

  return {
    integration: data,
    refresh,
    error,
    status,
    apiKey: computed(() => data.value?.apiKey ?? null),
    userId: computed(() => data.value?.userId ?? null),
    apiBase: computed(() => data.value?.apiBase ?? 'https://gscdump.com'),
    browserAnalyzerEnabled: computed(() => !!data.value?.browserAnalyzerEnabled),
  }
}

export async function useRefreshGscdumpIntegration(): Promise<void> {
  const nuxt = useNuxtApp()
  await refreshNuxtData(GSCDUMP_INTEGRATION_KEY).catch(err => logWarn('gscdump.integration.probe_failed', err, { fn: 'refreshNuxtData' }))
  delete nuxt.payload.data[GSCDUMP_INTEGRATION_KEY]
}

export interface GscdumpIntegrationPatch {
  browserAnalyzerEnabled?: boolean
}

/**
 * Optimistic PATCH for gscdump integration settings. Mirrors the previous
 * useMePatch behaviour but scoped to one integration: writes optimistic state
 * into the SSR payload cache, fetches the canonical response, rolls back on
 * error.
 */
export function useGscdumpIntegrationPatch() {
  const proFetch = useProFetch()
  const nuxt = useNuxtApp()
  const { data } = useNuxtData<GscdumpIntegration | null>(GSCDUMP_INTEGRATION_KEY)

  function setCachedIntegration(next: GscdumpIntegration | null) {
    data.value = next
    nuxt.payload.data[GSCDUMP_INTEGRATION_KEY] = next
  }

  function applyOptimistic(patch: GscdumpIntegrationPatch): GscdumpIntegration | null {
    const prev = data.value ?? (nuxt.payload.data[GSCDUMP_INTEGRATION_KEY] as GscdumpIntegration | null | undefined)
    if (!prev)
      return null
    const next: GscdumpIntegration = {
      ...prev,
      browserAnalyzerEnabled: typeof patch.browserAnalyzerEnabled === 'boolean'
        ? patch.browserAnalyzerEnabled
        : prev.browserAnalyzerEnabled,
    }
    setCachedIntegration(next)
    return prev
  }

  async function patchIntegration(body: GscdumpIntegrationPatch): Promise<GscdumpIntegration | null> {
    const rollback = applyOptimistic(body)
    return proFetch<GscdumpIntegration | null>('/api/pro/gscdump-integration', {
      method: 'PATCH',
      body,
    })
      .then((next) => {
        if (next)
          setCachedIntegration(next)
        return next
      })
      .catch((err) => {
        if (rollback)
          setCachedIntegration(rollback)
        throw err
      })
  }

  return { patchIntegration }
}

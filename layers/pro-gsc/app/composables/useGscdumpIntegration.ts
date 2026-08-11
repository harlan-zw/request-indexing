// Lazy gscdump integration credentials. The owner of "what API key + analyzer
// settings this user has on gscdump.com." Lives in pro-gsc rather than on
// Caller (per ADR-0002). Hydrated from SSR payload via the query key, so
// first-render reads are race-free.

import { logWarn } from '~~/shared/logging'

export interface GscdumpIntegration {
  /**
   * Whether the caller has a stored gscdump credential. Never the credential
   * itself: every gscdump HTTP call from the browser goes through the
   * same-origin v1 proxy, which resolves the caller's stored key
   * server-side, so the key never needs to reach browser memory.
   */
  connected: boolean
  browserAnalyzerEnabled: boolean
}

/** SSR payload + useNuxtData key. Plugins must read via this constant, not a duplicated literal. */
export const GSCDUMP_INTEGRATION_KEY = 'app:gscdump-integration'

export function useGscdumpIntegration() {
  const { data, refresh, error, status } = useNuxtQuery<GscdumpIntegration | null>('/api/pro/gscdump-integration', {
    key: GSCDUMP_INTEGRATION_KEY,
    server: true,
    deep: false,
    staleTime: Infinity,
  })

  return {
    integration: data,
    refresh,
    error,
    status,
    connected: computed(() => !!data.value?.connected),
    browserAnalyzerEnabled: computed(() => !!data.value?.browserAnalyzerEnabled),
  }
}

export async function useRefreshGscdumpIntegration(): Promise<void> {
  await invalidateNuxtQueries(GSCDUMP_INTEGRATION_KEY)
    .catch(err => logWarn('gscdump.integration.probe_failed', err, { fn: 'invalidateNuxtQueries' }))
}

export interface GscdumpIntegrationPatch {
  browserAnalyzerEnabled?: boolean
}

/**
 * Optimistic PATCH for gscdump integration settings. Mirrors the previous
 * useMePatch behaviour but scoped to one integration.
 */
export function useGscdumpIntegrationPatch() {
  const proFetch = useProFetch()

  type PatchContext
    = | { _tag: 'cached', previous: GscdumpIntegration | null }
      | { _tag: 'missing' }

  const mutation = useNuxtMutation<GscdumpIntegrationPatch, GscdumpIntegration | null, PatchContext>({
    mutation: body => proFetch<GscdumpIntegration | null>('/api/pro/gscdump-integration', {
      method: 'PATCH',
      body,
    }),
    onMutate: (patch) => {
      const previous = getQueryData<GscdumpIntegration | null>(GSCDUMP_INTEGRATION_KEY)
      if (previous === undefined)
        return { _tag: 'missing' }
      if (previous) {
        setQueryData<GscdumpIntegration | null>(GSCDUMP_INTEGRATION_KEY, {
          ...previous,
          browserAnalyzerEnabled: patch.browserAnalyzerEnabled ?? previous.browserAnalyzerEnabled,
        })
      }
      return { _tag: 'cached', previous }
    },
    onSuccess: next => setQueryData(GSCDUMP_INTEGRATION_KEY, next),
    onError: (_error, _body, context) => {
      if (context?._tag === 'cached')
        setQueryData(GSCDUMP_INTEGRATION_KEY, context.previous)
    },
  })

  async function patchIntegration(body: GscdumpIntegrationPatch): Promise<GscdumpIntegration | null> {
    const result = await mutation.mutateSafe(body)
    if (result._tag === 'err')
      throw result.error
    return result.data
  }

  return { patchIntegration }
}

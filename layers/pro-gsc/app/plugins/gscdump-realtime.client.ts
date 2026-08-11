// Opens a WebSocket to gscdump.com once pro auth resolves and translates
// sync/enrichment events into per-site invalidation bumps, so mounted
// `useGscQuery` instances re-fetch without a page reload.
//
// Auth + lifecycle:
// - Waits for `useGscdumpIntegration()` to report `connected`. Without it, no
//   connection is opened (anonymous / unconnected user state). The client
//   never holds a gscdump API key: it authenticates same-origin through the
//   v1 proxy, which resolves the caller's stored credential server-side,
//   including for minting the realtime ticket.
// - Connects only on /pro/dashboard/* routes; the gscdump-auth plugin already
//   gates activation behind the same predicate.
// - Closes the socket on tab unload. We do NOT close on route change off the
//   dashboard — re-entering is common and reconnect cost > keep-alive cost.
//
// Event handling:
// - `sync.site_complete` / `sync.complete` / `enrichment.complete` →
//   `bumpGscInvalidation(siteId)` so per-site queries refresh.
// - `sync.progress` is high-volume and informational only; ignored here
//   (consumed by `ProGscStatus` polling already).
// - `sync.failed`, `job.failed`, `auth.failed`, `needs_reauth` → telemetry
//   only; the dashboard surfaces these through other channels.

import type { RealtimeV1Event } from '@gscdump/contracts/v1'
import type { GscdumpRealtimeV1Client } from '@gscdump/sdk/v1'
import type { GscdumpIntegration } from '../composables/useGscdumpIntegration'
import { createGscdumpRealtimeV1Client, createGscdumpV1Client } from '@gscdump/sdk/v1'
import { logWarn } from '~~/shared/logging'
import { GSCDUMP_INTEGRATION_KEY } from '../composables/useGscdumpIntegration'
import { bumpGscInvalidation } from '../internal/composables/useGscInvalidation'
import { isProAppPath } from '../utils/_is-pro-app-path'

export default defineNuxtPlugin({
  name: 'pro-gscdump-realtime',
  // Run after `00.gscdump-auth.client.ts` so the integration state is hydrated.
  dependsOn: ['pro-gscdump-auth'],
  setup() {
    const route = useRoute()
    let activated = false
    let stopWatch: (() => void) | null = null
    let realtime: GscdumpRealtimeV1Client | null = null

    function invalidateAffectedSites(event: RealtimeV1Event): void {
      if (event.name === 'site.lifecycle.progress')
        return

      const siteIds = new Set(
        event.changes
          .filter(change => change.type === 'site')
          .map(change => change.id),
      )
      if (event.subject.type === 'site')
        siteIds.add(event.subject.id)

      for (const siteId of siteIds)
        bumpGscInvalidation(siteId)
    }

    function activate(): void {
      if (activated)
        return
      activated = true

      const integration = useNuxtData<GscdumpIntegration | null>(GSCDUMP_INTEGRATION_KEY).data

      stopWatch = watch(
        () => integration.value?.connected ?? false,
        (connected) => {
          if (realtime) {
            realtime.stop()
            realtime = null
          }
          if (!connected)
            return

          // Session-proxied: the browser never holds a gscdump API key. The
          // proxy resolves the caller's stored credential server-side and
          // mints the realtime ticket on their behalf.
          const http = createGscdumpV1Client({
            apiRoot: '/api/_gscdump',
            credential: 'session-proxy',
            fetch: (request, init) => {
              const headers = new Headers(init?.headers)
              headers.delete('authorization')
              return fetch(request, { ...init, headers })
            },
          })
          const client = createGscdumpRealtimeV1Client({
            ticketProvider: () => http.createRealtimeTicket({
              body: { origin: window.location.origin },
            }),
            applyEvent: async event => invalidateAffectedSites(event),
            resync: async () => refreshNuxtData(),
            onObservation: (observation) => {
              if (observation.type === 'error')
                logWarn('gscdump.integration.probe_failed', observation.error, { source: 'realtime' })
            },
          })
          realtime = client
          void client.start().catch((err) => {
            logWarn('gscdump.integration.probe_failed', err, { source: 'realtime', stage: 'connect' })
            if (realtime === client) {
              client.stop()
              realtime = null
            }
          })
        },
        { immediate: true },
      )

      useEventListener(window, 'beforeunload', () => {
        realtime?.stop()
        realtime = null
      })
    }

    if (isProAppPath(route.path)) {
      activate()
      return
    }
    const stop = watch(() => route.path, (path) => {
      if (isProAppPath(path)) {
        stop()
        activate()
      }
    })

    onScopeDispose(() => {
      stopWatch?.()
      realtime?.stop()
      realtime = null
    })
  },
})

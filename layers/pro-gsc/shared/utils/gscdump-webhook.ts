// Pure mapping from gscdump's canonical webhook events onto local `sites` row
// state. Kept out of the route handler so it can be tested directly: the
// receiver this replaced switched on event names gscdump never sends
// (`sync.started`, `sync.completed`), so every delivery fell through and site
// status silently never moved.

import type { WebhookEnvelope } from '@gscdump/contracts'

export interface SyncStatusPatch {
  gscdumpSyncStatus: 'syncing' | 'synced' | 'error'
  isSynced?: boolean
  lastSynced?: number
}

/**
 * The local `sites` patch for a canonical event, or null when the event says
 * nothing about a property's sync state.
 *
 * `job.failed` is deliberately unmapped: it covers background work that is not
 * tied to a property's own sync health, so mapping it to `error` would flag
 * healthy sites. `user.lifecycle.changed` is likewise account-scoped, not
 * site-scoped.
 *
 * `now` is passed in rather than read from the clock so the mapping stays pure.
 */
export function syncStatusPatch(envelope: Pick<WebhookEnvelope, 'event' | 'data'>, now: number): SyncStatusPatch | null {
  switch (envelope.event) {
    case 'site.analytics.ready':
      return { gscdumpSyncStatus: 'synced', isSynced: true, lastSynced: now }
    case 'site.lifecycle.changed':
      return lifecyclePatch(envelope.data.transition, now)
    case 'site.auth.failed':
      return { gscdumpSyncStatus: 'error' }
    default:
      return null
  }
}

/**
 * `site.lifecycle.changed` says what moved in `data.transition`. These are the
 * values gscdump's lifecycle listeners send. An unknown or missing transition
 * changes nothing, so a new gscdump transition cannot mislabel a site.
 */
function lifecyclePatch(transition: unknown, now: number): SyncStatusPatch | null {
  switch (transition) {
    case 'analytics.ready':
      return { gscdumpSyncStatus: 'synced', isSynced: true, lastSynced: now }
    case 'analytics.failed':
    case 'site.auth_failed':
      return { gscdumpSyncStatus: 'error' }
    case 'property.linked':
    case 'analytics.queued':
      return { gscdumpSyncStatus: 'syncing' }
    default:
      return null
  }
}

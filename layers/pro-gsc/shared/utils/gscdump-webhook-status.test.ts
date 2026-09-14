// The receiver this logic replaced switched on `sync.started` / `sync.completed`
// / `sync.failed`, none of which gscdump sends. Every delivery fell through the
// switch and site status never moved. These tests pin the mapping to what
// gscdump really delivers so that failure cannot recur silently.
//
// `site.lifecycle.changed` carries its meaning in `data.transition`. Mapping on
// the event name alone marked a finished sync (`analytics.ready`) as syncing.

import type { WebhookEnvelope } from '@gscdump/contracts'
import { describe, expect, it } from 'vitest'
import { syncStatusPatch } from './gscdump-webhook'

const NOW = 1_778_457_600_000

function lifecycle(transition: unknown): Pick<WebhookEnvelope, 'event' | 'data'> {
  return { event: 'site.lifecycle.changed', data: { transition } }
}

describe('syncStatusPatch', () => {
  it('marks a site synced when analytics land', () => {
    expect(syncStatusPatch({ event: 'site.analytics.ready', data: {} }, NOW)).toEqual({
      gscdumpSyncStatus: 'synced',
      isSynced: true,
      lastSynced: NOW,
    })
  })

  it('marks a site synced when its lifecycle says analytics are ready', () => {
    expect(syncStatusPatch(lifecycle('analytics.ready'), NOW)).toEqual({
      gscdumpSyncStatus: 'synced',
      isSynced: true,
      lastSynced: NOW,
    })
  })

  it('marks a site errored when its lifecycle says the sync or grant failed', () => {
    expect(syncStatusPatch(lifecycle('analytics.failed'), NOW)).toEqual({ gscdumpSyncStatus: 'error' })
    expect(syncStatusPatch(lifecycle('site.auth_failed'), NOW)).toEqual({ gscdumpSyncStatus: 'error' })
  })

  it('marks a site syncing while its lifecycle is still moving', () => {
    expect(syncStatusPatch(lifecycle('property.linked'), NOW)).toEqual({ gscdumpSyncStatus: 'syncing' })
    expect(syncStatusPatch(lifecycle('analytics.queued'), NOW)).toEqual({ gscdumpSyncStatus: 'syncing' })
  })

  it('leaves site state alone for a lifecycle change it cannot read', () => {
    expect(syncStatusPatch(lifecycle('analytics.something_new'), NOW)).toBeNull()
    expect(syncStatusPatch(lifecycle(undefined), NOW)).toBeNull()
    expect(syncStatusPatch(lifecycle(42), NOW)).toBeNull()
  })

  it('marks a site errored when its Google grant fails', () => {
    expect(syncStatusPatch({ event: 'site.auth.failed', data: {} }, NOW)).toEqual({ gscdumpSyncStatus: 'error' })
  })

  it('leaves site state alone for account-scoped and background events', () => {
    // `job.failed` is background work, not a property's sync health; mapping it
    // to `error` would flag healthy sites.
    expect(syncStatusPatch({ event: 'job.failed', data: {} }, NOW)).toBeNull()
    expect(syncStatusPatch({ event: 'user.lifecycle.changed', data: { transition: 'analytics.ready' } }, NOW)).toBeNull()
  })
})

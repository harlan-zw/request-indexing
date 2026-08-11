// The receiver this logic replaced switched on `sync.started` / `sync.completed`
// / `sync.failed`, none of which gscdump sends. Every delivery fell through the
// switch and site status never moved. These tests pin the mapping to the
// canonical event names so that failure cannot recur silently.

import { CANONICAL_WEBHOOK_EVENTS } from '@gscdump/contracts'
import { describe, expect, it } from 'vitest'
import { syncStatusPatch } from './gscdump-webhook'

const NOW = 1_778_457_600_000

describe('syncStatusPatch', () => {
  it('marks a site synced when analytics land', () => {
    expect(syncStatusPatch('site.analytics.ready', NOW)).toEqual({
      gscdumpSyncStatus: 'synced',
      isSynced: true,
      lastSynced: NOW,
    })
  })

  it('marks a site syncing while its lifecycle is moving', () => {
    expect(syncStatusPatch('site.lifecycle.changed', NOW)).toEqual({ gscdumpSyncStatus: 'syncing' })
  })

  it('marks a site errored when its Google grant fails', () => {
    expect(syncStatusPatch('site.auth.failed', NOW)).toEqual({ gscdumpSyncStatus: 'error' })
  })

  it('leaves site state alone for account-scoped and background events', () => {
    // `job.failed` is background work, not a property's sync health; mapping it
    // to `error` would flag healthy sites.
    expect(syncStatusPatch('job.failed', NOW)).toBeNull()
    expect(syncStatusPatch('user.lifecycle.changed', NOW)).toBeNull()
  })

  it('only maps events gscdump actually sends', () => {
    // Guards the original bug: a mapped name that is not in the canonical set
    // is dead code, because no delivery will ever carry it.
    const mapped = CANONICAL_WEBHOOK_EVENTS.filter(event => syncStatusPatch(event, NOW) !== null)

    expect(mapped.length).toBeGreaterThan(0)
    for (const event of mapped)
      expect(CANONICAL_WEBHOOK_EVENTS).toContain(event)
  })
})

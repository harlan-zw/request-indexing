// Shared gscdump-lifecycle helpers for the `/api/sites/*` family. Centralizes
// the "match a local site row against its gscdump lifecycle entry" logic used
// by list/preview/stats so each route only needs to fetch the lifecycle once
// per request and reuse the same derivation.
import type { PartnerLifecycleResponse, PartnerLifecycleSite } from '#layers/pro-gsc/shared/gscdump-api'
import { differenceInCalendarDays } from 'date-fns'
import { analyticsStatusToSyncStatus, findLifecycleSite } from '#layers/pro-gsc/server/utils/gscdump-client'

export type SiteSyncStatus = 'idle' | 'pending' | 'syncing' | 'synced' | 'error'

/** Google Search Console only retains ~16 months of data. */
const GSC_RETENTION_DAYS = 486

export function lifecycleSiteFor(lifecycle: PartnerLifecycleResponse | null, gscdumpSiteId: string | null): PartnerLifecycleSite | null {
  if (!lifecycle || !gscdumpSiteId)
    return null
  return findLifecycleSite(lifecycle, gscdumpSiteId)
}

export function syncStatusFor(lifecycleSite: PartnerLifecycleSite | null, fallback: SiteSyncStatus | null): SiteSyncStatus {
  if (lifecycleSite)
    return analyticsStatusToSyncStatus(lifecycleSite.analytics.status)
  return fallback ?? 'pending'
}

/** True once the oldest synced date is at (or past) GSC's retention cliff, so older rows are starting to roll off. */
export function isNearRetentionLimit(oldestSyncedDate: string | null): boolean {
  if (!oldestSyncedDate)
    return false
  return differenceInCalendarDays(new Date(), new Date(oldestSyncedDate)) >= GSC_RETENTION_DAYS
}

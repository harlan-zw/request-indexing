import { eq } from 'drizzle-orm'
import { analyticsStatusToSyncStatus, useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'

export interface GscdumpSyncSite {
  siteId: string
  siteUrl: string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error' | 'idle'
  syncProgress?: { completed: number, total: number, percent: number }
  lastSyncAt: number | null
  newestDateSynced: string | null
  oldestDateSynced: string | null
}

export default defineProApiHandler({}, async ({ db, caller }): Promise<{ sites: GscdumpSyncSite[] }> => {
  const [user] = await db
    .select({ gscdumpUserId: users.gscdumpUserId })
    .from(users)
    .where(eq(users.userId, caller.user.id))

  if (!user?.gscdumpUserId)
    return { sites: [] }

  const lifecycle = await useGscdumpClient().getUserLifecycle(user.gscdumpUserId).catch(() => null)
  if (!lifecycle)
    return { sites: [] }

  return {
    sites: lifecycle.sites.map(site => ({
      siteId: site.siteId,
      siteUrl: site.gscPropertyUrl || site.requestedUrl,
      syncStatus: analyticsStatusToSyncStatus(site.analytics.status),
      syncProgress: site.analytics.progress,
      lastSyncAt: site.updatedAt ? Date.parse(site.updatedAt) : null,
      newestDateSynced: site.analytics.syncedRange.newest,
      oldestDateSynced: site.analytics.syncedRange.oldest,
    })),
  }
})

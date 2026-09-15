import { eq } from 'drizzle-orm'
import { logger } from '~~/shared/server/logger'
import { lifecycleSiteToUserSite, useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { users } from '#layers/pro-saas/server/database'
import { defineProApiHandler } from '#layers/pro-saas/server/utils/handler'
import { readOptionalUserLifecycle } from '#layers/pro-saas/server/utils/site-lifecycle'

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

  const lifecycleRead = await readOptionalUserLifecycle(user?.gscdumpUserId, useGscdumpClient)
  if (lifecycleRead._tag === 'Unavailable')
    logger.warn('[gsc-connected-sites] gscdump lifecycle unavailable:', lifecycleRead.reason)
  if (lifecycleRead._tag !== 'Loaded')
    return { sites: [] }

  return {
    sites: lifecycleRead.lifecycle.sites.map(lifecycleSiteToUserSite),
  }
})

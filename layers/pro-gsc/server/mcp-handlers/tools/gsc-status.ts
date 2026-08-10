import { findLifecycleSite, lifecycleSiteToSyncStatus } from '#layers/pro-gsc/server/utils/gscdump-client'
import { defineMcpGscSiteTool } from '#layers/pro-saas/server/utils/mcp/frame'
import { siteUrlSchema } from '#layers/pro-saas/server/utils/mcp/gsc'
import { useMcpProAuth } from '#layers/pro-saas/server/utils/pro-auth'

export default defineMcpGscSiteTool({
  name: 'gsc_status',
  description: 'Check Google Search Console connection status and sync progress for a site.',
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
  inputSchema: {
    siteUrl: siteUrlSchema,
  },
  cache: '5min',
  async handler(_input, { site }) {
    const gscdump = useGscdumpClient()
    const auth = useMcpProAuth()
    const gscdumpUserId = auth?.user.gscdumpUserId
    if (!gscdumpUserId)
      return errorResult('Google Search Console is not connected for this account.')

    const lifecycle = await gscdump.getUserLifecycle(gscdumpUserId)
    const lifecycleSite = findLifecycleSite(lifecycle, site.gscdumpSiteId)
    if (!lifecycleSite)
      return errorResult('Google Search Console lifecycle site was not found.')
    const status = lifecycleSiteToSyncStatus(lifecycleSite)

    const totalJobs = status.jobs.completed + status.jobs.queued + status.jobs.processing + status.jobs.failed

    return jsonResult({
      connected: true,
      site: site.url,
      syncStatus: status.syncStatus,
      syncProgress: {
        percent: status.progress,
        completed: status.jobs.completed,
        total: totalJobs,
      },
      dateRange: {
        oldest: status.oldestDateSynced,
        newest: status.newestDateSynced,
      },
      lastSyncAt: status.lastSyncAt,
      // New fields
      isSyncing: status.isSyncing,
      hasData: status.hasData,
      isComplete: status.isComplete,
      daysSynced: status.daysSynced,
      daysAvailable: status.daysAvailable,
      lastError: status.lastError,
    })
  },
})

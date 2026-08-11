import { z } from 'zod'
import { defineMcpGscSiteTool } from '#layers/pro-saas/server/utils/mcp/frame'
import {
  siteUrlSchema,
} from '#layers/pro-saas/server/utils/mcp/gsc'

export default defineMcpGscSiteTool({
  name: 'gsc_sitemaps',
  description: 'Manage Google Search Console sitemaps. List status/errors (default), or submit/delete/refresh sitemaps.',
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true },
  inputSchema: {
    siteUrl: siteUrlSchema,
    action: z.enum(['list', 'submit', 'delete', 'refresh']).default('list').describe('Action: list (default), submit, delete, or refresh'),
    sitemapUrl: z.string().url().optional().describe('Sitemap URL (required for submit/delete)'),
  },
  inputExamples: [
    { action: 'list' },
    { action: 'submit', sitemapUrl: 'https://example.com/sitemap.xml' },
    { action: 'refresh' },
  ],
  async handler({ action, sitemapUrl }, { site }) {
    const gscdump = useGscdumpClient()

    if (action === 'list') {
      const result = await gscdump.getSitemaps(site.gscdumpSiteId)
      return jsonResult({
        site: site.url,
        sitemaps: result.sitemaps.map(s => ({
          path: s.path,
          type: s.type || 'sitemap',
          isIndex: s.isSitemapsIndex || false,
          lastSubmitted: s.lastSubmitted,
          lastDownloaded: s.lastDownloaded,
          errors: s.errors || 0,
          warnings: s.warnings || 0,
          isPending: s.isPending || false,
          contents: s.contents?.map(c => ({
            type: c.type,
            submitted: c.submitted,
            indexed: c.indexed,
          })) || null,
        })),
      })
    }

    if (action === 'refresh') {
      const result = await gscdump.refreshSitemaps(site.gscdumpSiteId)
      return jsonResult({
        site: site.url,
        action: 'refreshed',
        sitemapCount: result.sitemapCount,
        changed: result.changed,
      })
    }

    // submit or delete
    if (!sitemapUrl)
      return errorResult('sitemapUrl is required for submit/delete actions')

    const result = await gscdump.submitSitemap(site.gscdumpSiteId, sitemapUrl, action as 'submit' | 'delete')
    return jsonResult({
      site: site.url,
      action: result.action,
      sitemapUrl: result.sitemapUrl,
      success: result.success,
    })
  },
})

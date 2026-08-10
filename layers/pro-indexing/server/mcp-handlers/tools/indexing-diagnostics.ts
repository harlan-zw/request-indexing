import { z } from 'zod'
import { useGscdumpClient } from '#layers/pro-gsc/server/utils/gscdump-client'
import { defineMcpProGscSiteTool } from '#layers/pro-saas/server/utils/mcp/frame'
import { siteUrlSchema } from '#layers/pro-saas/server/utils/mcp/site'

export default defineMcpProGscSiteTool({
  name: 'indexing_diagnostics',
  description: 'Indexing diagnostics: issue counts (default) or list affected URLs. Shows what Google skipped and why.',
  annotations: { readOnlyHint: true, openWorldHint: true },
  inputSchema: {
    siteUrl: siteUrlSchema,
    action: z.enum(['summary', 'urls']).default('summary').describe('summary: issue counts. urls: affected URLs.'),
    issue: z.string().optional().describe('Filter urls by issue type (e.g. "soft_404", "not_found")'),
    status: z.enum(['indexed', 'not_indexed', 'pending']).optional().describe('Filter urls by status'),
    limit: z.number().min(1).max(100).default(25),
    offset: z.number().min(0).default(0),
  },
  inputExamples: [
    { action: 'summary' },
    { action: 'urls', status: 'not_indexed', limit: 50 },
  ],
  cache: '30min',
  async handler({ action, issue, status, limit, offset }, { site }) {
    const gscdump = useGscdumpClient()

    if (action === 'summary') {
      const { summary, issues } = await gscdump.getIndexingDiagnostics(site.gscdumpSiteId!)
      return jsonResult({
        site: site.url,
        coverage: `${summary.indexed}/${summary.totalUrls} (${summary.indexedPercent}%)`,
        issues: issues
          .filter(i => i.count > 0)
          .sort((a, b) => b.count - a.count)
          .map(i => ({ type: i.type, label: i.label, severity: i.severity, count: i.count })),
      })
    }

    const { urls, pagination } = await gscdump.getIndexingUrls(site.gscdumpSiteId!, { limit, offset, status, issue })
    return jsonResult({
      site: site.url,
      total: pagination.total,
      hasMore: pagination.hasMore,
      urls: urls.map(u => ({
        url: u.url,
        verdict: u.verdict,
        coverage: u.coverageState,
        indexing: u.indexingState,
        canonical: u.googleCanonical !== u.userCanonical ? { user: u.userCanonical, google: u.googleCanonical } : undefined,
        lastCrawl: u.lastCrawlTime,
      })),
    })
  },
})

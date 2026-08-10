import type { SemanticStatus } from '#layers/design-system/composables/proSemanticColors'

export interface IndexingIssueDetail {
  description: string
  fix: string
}

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface IndexingIssue {
  type: string
  label: string
  severity: IssueSeverity
  count: number
}

export const issueDetails: Record<string, IndexingIssueDetail> = {
  crawled_not_indexed: {
    description: 'Google crawled these pages but decided not to add them to the index. This often means the content was deemed low-quality, duplicate, or not useful enough.',
    fix: 'Improve content quality and uniqueness. Add internal links pointing to these pages. Ensure they have clear, distinct value compared to other pages on your site.',
  },
  discovered_not_indexed: {
    description: 'Google knows these URLs exist but hasn\'t crawled them yet. This is usually a crawl-budget or priority signal — Google deemed other pages more important.',
    fix: 'Add strong internal links from indexed pages. Submit the URL via Search Console\'s URL Inspection > Request Indexing. Improve site authority and crawl-budget signals; check no resource constraints (slow server, large response sizes) are deterring the crawl.',
  },
  server_error: {
    description: 'Google encountered 5xx server errors when trying to crawl these URLs. The pages were unreachable at crawl time.',
    fix: 'Check your server logs for errors. Ensure your hosting can handle Googlebot traffic. Fix any backend issues causing 500/502/503 errors.',
  },
  unknown_to_google: {
    description: 'These URLs exist on your site but Google hasn\'t discovered them yet. They may be orphaned pages or missing from your sitemap.',
    fix: 'Add these URLs to your sitemap. Create internal links to them from well-indexed pages. Submit the sitemap in Google Search Console.',
  },
  stale_crawl: {
    description: 'Google hasn\'t re-crawled these pages in over 30 days. They may have low perceived value or your crawl budget may be exhausted.',
    fix: 'Update content on these pages to signal freshness. Improve internal linking. Ensure your site loads quickly to maximize crawl budget efficiency.',
  },
  very_stale_crawl: {
    description: 'Google hasn\'t visited these pages in over 60 days. They are at risk of being dropped from the index entirely.',
    fix: 'Prioritize updating these pages immediately. Add fresh internal links. Consider requesting re-indexing via Google Search Console\'s URL Inspection tool.',
  },
  not_found: {
    description: 'These URLs return 404 errors. Google previously knew about them but they no longer exist.',
    fix: 'If the content moved, add 301 redirects to the new URLs. If intentionally removed, ensure no internal links still point to them. The 404s will clear over time.',
  },
  soft_404: {
    description: 'These pages return a 200 status but Google detects them as effectively empty or error pages — "soft" 404s.',
    fix: 'Return a proper 404 status code for missing pages. If the pages should exist, add meaningful content. Avoid thin placeholder pages.',
  },
  blocked_robots: {
    description: 'Your robots.txt file is preventing Google from crawling these URLs.',
    fix: 'Review your robots.txt rules. Remove Disallow directives for pages you want indexed. Remember that blocked pages can\'t be indexed even if linked.',
  },
  noindex: {
    description: 'These pages have a noindex meta tag or X-Robots-Tag header, telling Google not to include them in search results.',
    fix: 'If these pages should be indexed, remove the noindex directive. Check for noindex in meta tags, HTTP headers, and any SEO plugin configuration.',
  },
  redirect: {
    description: 'These URLs redirect to other pages. Google follows the redirect and indexes the destination instead.',
    fix: 'This is usually expected behavior. Ensure redirects point to the correct destination. Update internal links to point directly to the final URL to save crawl budget.',
  },
  canonical_mismatch: {
    description: 'The canonical URL declared on these pages points to a different URL. Google may index the canonical target instead.',
    fix: 'Ensure each page\'s canonical tag points to itself, or intentionally to the preferred version. Fix any unintended canonical tags added by CMS plugins.',
  },
  fragment_url: {
    description: 'These URLs contain fragment identifiers (#). Googlebot typically ignores fragments as they\'re client-side only.',
    fix: 'Avoid using fragment URLs as unique pages. If using client-side routing with hashes, migrate to proper URL paths for better indexability.',
  },
  not_indexed: {
    description: 'These URLs are not in Google\'s index. This is a general category — the specific reason may vary.',
    fix: 'Check individual URLs in Google Search Console\'s URL Inspection tool for specific reasons. Common causes include quality, duplicate content, or crawl issues.',
  },
}

export const nuxtSeoTips: Record<string, { modules: string[], tip: string }> = {
  blocked_robots: {
    modules: ['@nuxtjs/robots', '@nuxtjs/seo'],
    tip: 'Check nuxt.config robots rules and route rules for Disallow:\n\nexport default defineNuxtConfig({\n  robots: { disallow: [\'/admin\'] },\n  routeRules: {\n    \'/secret/**\': { robots: false }\n  }\n})',
  },
  noindex: {
    modules: ['@nuxtjs/seo'],
    tip: 'Check for noindex in route rules or page meta:\n\n// nuxt.config.ts\nrouteRules: { \'/draft/**\': { index: false } }\n\n// pages/draft.vue\ndefinePageMeta({ robots: \'noindex\' })',
  },
  unknown_to_google: {
    modules: ['@nuxtjs/sitemap', '@nuxtjs/seo'],
    tip: 'Ensure @nuxtjs/sitemap includes these routes. Dynamic routes need sources:\n\nexport default defineNuxtConfig({\n  sitemap: {\n    sources: [\'/api/__sitemap__/urls\']\n  }\n})\n\nVerify at /sitemap.xml that these URLs appear.',
  },
  canonical_mismatch: {
    modules: ['@nuxtjs/seo'],
    tip: '@nuxtjs/seo auto-generates canonicals from site.url. Check for conflicts:\n\n// nuxt.config.ts — set your canonical origin\nsite: { url: \'https://example.com\' }\n\n// Override per page if needed\nuseHead({ link: [{ rel: \'canonical\', href: \'https://example.com/preferred\' }] })',
  },
  soft_404: {
    modules: ['@nuxtjs/seo'],
    tip: 'Ensure pages render content server-side, not just client-side. Check for missing data:\n\n// pages/[slug].vue\nconst { data } = await useAsyncData(() => fetchContent(slug))\nif (!data.value)\n  throw createError({ statusCode: 404 }) // Return real 404, not empty page',
  },
}

export const issueIcons: Record<string, string> = {
  canonical_mismatch: 'i-lucide-git-compare',
  stale_crawl: 'i-lucide-clock',
  very_stale_crawl: 'i-lucide-clock',
  unknown_to_google: 'i-lucide-help-circle',
  crawled_not_indexed: 'i-lucide-eye-off',
  discovered_not_indexed: 'i-lucide-search',
  not_found: 'i-lucide-file-x',
  soft_404: 'i-lucide-file-warning',
  server_error: 'i-lucide-server-crash',
  blocked_robots: 'i-lucide-shield-off',
  noindex: 'i-lucide-eye-off',
  redirect: 'i-lucide-arrow-right',
  fragment_url: 'i-lucide-hash',
  not_indexed: 'i-lucide-x-circle',
}

export const severityOrder: IssueSeverity[] = ['error', 'warning', 'info']

export const severityConfig: Record<IssueSeverity, { label: string, headerIcon: string, border: string, borderActive: string, bg: string, bgActive: string, ring: string, focusRing: string, text: string, iconBg: string }> = {
  error: {
    label: 'Errors',
    headerIcon: 'i-lucide-alert-triangle',
    border: 'border-default',
    borderActive: 'border-error/50',
    bg: 'bg-elevated hover:border-error/30',
    bgActive: 'bg-error/10',
    ring: 'ring-2 ring-error/20',
    focusRing: 'focus-visible:ring-error/50',
    text: 'text-error',
    iconBg: 'bg-error/15',
  },
  warning: {
    label: 'Warnings',
    headerIcon: 'i-lucide-alert-circle',
    border: 'border-default',
    borderActive: 'border-warning/50',
    bg: 'bg-elevated hover:border-warning/30',
    bgActive: 'bg-warning/10',
    ring: 'ring-2 ring-warning/20',
    focusRing: 'focus-visible:ring-warning/50',
    text: 'text-warning',
    iconBg: 'bg-warning/15',
  },
  info: {
    label: 'Info',
    headerIcon: 'i-lucide-info',
    border: 'border-default',
    borderActive: 'border-info/50',
    bg: 'bg-elevated hover:border-info/30',
    bgActive: 'bg-info/10',
    ring: 'ring-2 ring-info/20',
    focusRing: 'focus-visible:ring-info/50',
    text: 'text-info',
    iconBg: 'bg-info/15',
  },
}

// Investigation status configuration for Phase 3
export const investigationStatusConfig: Record<string, { label: string, icon: string, color: 'success' | 'info' | 'warning' | 'neutral' | 'error' }> = {
  investigated: { label: 'Investigated', icon: 'i-lucide-check-circle', color: 'success' },
  fixed: { label: 'Fixed', icon: 'i-lucide-wrench', color: 'success' },
  false_positive: { label: 'False positive', icon: 'i-lucide-shield-check', color: 'info' },
  wont_fix: { label: 'Won\'t fix', icon: 'i-lucide-ban', color: 'neutral' },
  monitoring: { label: 'Monitoring', icon: 'i-lucide-eye', color: 'warning' },
}

export const coverageLabels: Record<string, { short: string, color: string }> = {
  'Crawled - currently not indexed': { short: 'Crawled, not indexed', color: 'text-error' },
  'Discovered - currently not indexed': { short: 'Discovered, not indexed', color: 'text-warning' },
  'Server error (5xx)': { short: 'Server error', color: 'text-error' },
  'Not found (404)': { short: '404', color: 'text-error' },
  'Soft 404': { short: 'Soft 404', color: 'text-error' },
  'URL is unknown to Google': { short: 'Unknown', color: 'text-warning' },
  'Blocked by robots.txt': { short: 'Robots blocked', color: 'text-warning' },
}

export function coverageLabel(state: string) {
  return coverageLabels[state] || { short: state, color: 'text-muted' }
}

// --- Issue groups: organize by user action needed ---

export interface IssueGroup {
  id: string
  label: string
  icon: string
  description: string
  /** How hard are these to fix? Shown as a badge */
  effort: 'quick' | 'moderate' | 'involved'
  /** Does the user have direct control over these? */
  controlLevel: 'full' | 'partial' | 'none'
  /** Educational explanation shown in the group header */
  education: string
  /** Issue types belonging to this group */
  issueTypes: string[]
}

export const issueGroups: IssueGroup[] = [
  {
    id: 'quick-wins',
    label: 'Quick Wins',
    icon: 'i-lucide-zap',
    description: 'Configuration changes you can make right now',
    effort: 'quick',
    controlLevel: 'full',
    education: 'These issues are caused by your site\'s configuration preventing Google from indexing certain pages. If these pages should be indexed, the fix is usually a one-line config change — remove a robots.txt rule or fix a canonical URL. Highest-ROI fixes, zero content work.',
    issueTypes: ['blocked_robots', 'canonical_mismatch'],
  },
  {
    id: 'technical',
    label: 'Technical Fixes',
    icon: 'i-lucide-wrench',
    description: 'Server and URL issues to resolve',
    effort: 'moderate',
    controlLevel: 'full',
    education: 'These are infrastructure problems — your server is returning errors, pages have been deleted without redirects, or pages appear empty to Google. Fix server errors first (they affect crawl budget), then handle 404s with redirects, and ensure pages with real content return proper status codes.',
    issueTypes: ['server_error', 'not_found', 'soft_404'],
  },
  {
    id: 'content-discovery',
    label: 'Content & Discovery',
    icon: 'i-lucide-file-search',
    description: 'Help Google find and value your pages',
    effort: 'involved',
    controlLevel: 'partial',
    education: 'Google found these pages but either didn\'t think they were worth indexing, or hasn\'t discovered them yet. For crawled-but-not-indexed pages, improving content quality and internal linking helps — but Google ultimately decides what to index. For undiscovered pages, adding them to your sitemap and linking to them from indexed pages is the fix.',
    issueTypes: ['crawled_not_indexed', 'discovered_not_indexed', 'unknown_to_google', 'stale_crawl', 'very_stale_crawl'],
  },
  {
    id: 'expected',
    label: 'Expected Behavior',
    icon: 'i-lucide-info',
    description: 'Usually intentional — review but likely fine',
    effort: 'quick',
    controlLevel: 'none',
    education: 'These aren\'t really "issues" — they\'re usually intentional. Noindex tags are set deliberately to keep pages out of search. Redirects are normal when you move pages. Fragment URLs are stripped by Google by design. Review to make sure nothing unexpected is here.',
    issueTypes: ['noindex', 'redirect', 'fragment_url'],
  },
]

/** Map from issue type to its group id */
export const issueTypeToGroup: Record<string, string> = Object.fromEntries(
  issueGroups.flatMap(g => g.issueTypes.map(t => [t, g.id])),
)

export const effortConfig: Record<string, { label: string, icon: string, status: SemanticStatus }> = {
  quick: { label: 'Quick fix', icon: 'i-lucide-zap', status: 'success' },
  moderate: { label: 'Some effort', icon: 'i-lucide-wrench', status: 'warning' },
  involved: { label: 'Content work', icon: 'i-lucide-pen-line', status: 'info' },
}

export const controlConfig: Record<string, { label: string, icon: string }> = {
  full: { label: 'Fully in your control', icon: 'i-lucide-shield-check' },
  partial: { label: 'Partially in your control', icon: 'i-lucide-shield-half' },
  none: { label: 'Usually not actionable', icon: 'i-lucide-eye' },
}

export function enrichIssueDetails(modules?: { name: string }[]): Record<string, IndexingIssueDetail> {
  const moduleNames = new Set(modules?.map(m => m.name) ?? [])
  const result = { ...issueDetails }

  for (const [issueType, nuxtTip] of Object.entries(nuxtSeoTips)) {
    if (nuxtTip.modules.some(m => moduleNames.has(m)) && result[issueType]) {
      result[issueType] = {
        ...result[issueType],
        fix: `${result[issueType].fix}\n\nNuxt SEO: ${nuxtTip.tip}`,
      }
    }
  }
  return result
}

// The dashboard used to live at `/dashboard/site/:slug/*` with a page per
// Search Console dimension. There is one tree now, at nuxtseo.com's shape, and
// several of those pages were folded into one. A bare prefix swap would land
// half of them on a 404, so the mapping is written out.
//
// Pure on purpose: the server middleware that applies it does nothing but read
// the path and send the answer.

/** Legacy per-site pages that all became the Search Console overview. */
const SEARCH_CONSOLE_PAGES = new Set([
  'overview',
  'keywords',
  'keyword-insights',
  'pages',
  'countries',
  'analysis',
  'data',
])

/** Legacy per-site pages that kept a page of their own, under a new parent. */
const RELOCATED_PAGES: Record<string, string> = {
  'sitemaps': 'indexing/sitemaps',
  'web-indexing': 'indexing/submit',
  'settings': 'settings',
  'usages': 'usages',
}

export function mapLegacyDashboardPath(pathname: string): string | null {
  if (pathname === '/account' || pathname.startsWith('/account/'))
    return '/pro/dashboard/account'

  if (pathname !== '/dashboard' && !pathname.startsWith('/dashboard/'))
    return null

  const segments = pathname.slice('/dashboard'.length).split('/').filter(Boolean)

  if (!segments.length)
    return '/pro/dashboard'

  if (segments[0] !== 'site')
    return `/pro/dashboard/${segments.join('/')}`

  const slug = segments[1]
  if (!slug)
    return '/pro/dashboard'

  const base = `/pro/dashboard/sites/${slug}`
  const page = segments.slice(2).join('/')

  if (!page || SEARCH_CONSOLE_PAGES.has(page))
    return `${base}/search-console`

  // `keywords/:keyword` and `pages/:path` had detail pages. Nothing serves an
  // entity detail yet, so the list they came from is the closest honest answer.
  const family = segments[2]!
  if (SEARCH_CONSOLE_PAGES.has(family))
    return `${base}/search-console`

  const relocated = RELOCATED_PAGES[family]
  return relocated ? `${base}/${relocated}` : `${base}/search-console`
}

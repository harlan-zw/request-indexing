/**
 * Extract a normalized domain from various URL formats:
 * - Full URLs: https://www.example.com/path → example.com
 * - GSC domain properties: sc-domain:example.com → example.com
 * - Plain domains: www.example.com → example.com
 *
 * Always strips www. prefix and lowercases.
 */
export function extractDomain(url: string): string {
  if (url.startsWith('sc-domain:'))
    return url.replace('sc-domain:', '').toLowerCase()

  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname.replace(/^www\./, '').toLowerCase()
  }
  catch {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
  }
}

/**
 * Extract domain from a site URL, returning null if the URL is falsy or unparseable.
 */
export function extractSiteDomain(siteUrl: string | null | undefined): string | null {
  if (!siteUrl)
    return null
  try {
    return extractDomain(siteUrl)
  }
  catch {
    return null
  }
}

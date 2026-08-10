// GSC property-matching helpers used during sign-in/onboarding. Lifted from
// nuxtseo.com upstream; pure functions, no DB access.

export function matchGscSite(siteUrl: string | null | undefined, gscSiteUrl: string | null | undefined): boolean {
  if (!siteUrl || !gscSiteUrl)
    return false

  const getHostname = (url: string): string => {
    if (url.startsWith('sc-domain:'))
      return url.replace('sc-domain:', '')
    return new URL(url).hostname
  }

  const siteHostname = getHostname(siteUrl)

  if (gscSiteUrl.startsWith('sc-domain:')) {
    const domain = gscSiteUrl.replace('sc-domain:', '')
    return siteHostname === domain || siteHostname.endsWith(`.${domain}`)
  }

  const gscHostname = getHostname(gscSiteUrl)
  return siteHostname === gscHostname
}

const VERIFIED_GSC_PERMISSIONS = new Set(['siteOwner', 'siteFullUser', 'siteRestrictedUser'])

export function isVerifiedGscPermission(level: string | null | undefined): boolean {
  return !!level && VERIFIED_GSC_PERMISSIONS.has(level)
}

// "Best" GSC property for a site URL:
//   1. Verified Domain property (covers everything + readable)
//   2. Verified URL-prefix property
//   3. Unverified Domain property (returned only as fallback so callers can surface the gap)
//   4. Unverified URL-prefix property
export function pickBestGscProperty<T extends { siteUrl?: string | null, permissionLevel?: string | null }>(
  origin: string,
  availableSites: readonly T[],
): T | undefined {
  const matches = availableSites.filter(p => matchGscSite(origin, p.siteUrl))
  if (!matches.length)
    return undefined

  const isDomain = (p: T): boolean => !!p.siteUrl?.startsWith('sc-domain:')
  const verified = matches.filter(p => isVerifiedGscPermission(p.permissionLevel))
  const pool = verified.length ? verified : matches
  return pool.find(isDomain) ?? pool[0]
}

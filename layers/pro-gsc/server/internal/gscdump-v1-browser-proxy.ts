import type { ResolvedHttpV1Operation } from '@gscdump/contracts/v1/http'
// Pure decision logic for the same-origin gscdump v1 browser proxy
// (`server/api/_gscdump/[surface]/v1/[...path].ts`). No DB, no fetch: this
// module only decides *which* v1 operations the browser may reach and
// *whether* the caller may reach the requested site through them. The route
// handler resolves DB rows and calls these functions with plain data.
//
// The allowlist is deliberately explicit and closed: every entry is a real
// operation from the frozen `@gscdump/contracts` v1 registry. Nothing outside
// this list resolves, so the proxy cannot become an open relay onto
// gscdump.com.
import type { Caller } from '#layers/pro-saas/shared/caller'
import { createGscdumpV1Protocol, resolveHttpOperation } from '@gscdump/contracts/v1/http'
import { callerCan } from '#layers/pro-saas/shared/policies/team-policy'

const protocol = createGscdumpV1Protocol()

const browserOperationEntries = [
  { surface: protocol.surfaces.analytics, operation: protocol.surfaces.analytics.operations.queryReport },
  { surface: protocol.surfaces.analytics, operation: protocol.surfaces.analytics.operations.queryReportDetail },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getSiteAnalysis },
  // `useGscdumpSiteSummary` (useGscdump.ts) calls both of these for every site
  // card on `/dashboard`. They were missing from the allowlist, so the proxy
  // resolved no operation and answered 404, and four of five site cards on the
  // product's landing page rendered "Site data could not load".
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getQueryTrend },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getPageTrend },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getSiteIndexing },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.listSiteIndexingUrls },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getSiteIndexingDiagnostics },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.inspectSiteUrls },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getSiteSitemaps },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getSiteSitemapChanges },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.createSitemapAction },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.recoverSitePermission },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getTopAssociation },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.listAvailableSites },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getCanonicalMismatches },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getContentVelocity },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getCtrCurve },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getDarkTraffic },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getDeviceGap },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getKeywordBreadth },
  { surface: protocol.surfaces.partner, operation: protocol.surfaces.partner.operations.getPositionDistribution },
  { surface: protocol.surfaces.realtime, operation: protocol.surfaces.realtime.operations.createTicket },
] as const

type BrowserOperationEntry = typeof browserOperationEntries[number]
export const gscdumpV1BrowserOperationIds = Object.freeze(
  browserOperationEntries.map(entry => entry.operation.id),
)

export type GscdumpV1ProxyOperation = ResolvedHttpV1Operation<BrowserOperationEntry>

/**
 * The one operation whose path parameter is a gscdump *user* id rather than a
 * site id (`partner.users.sites.available.list`). The browser client sends an
 * opaque, syntactically-valid placeholder (see `GSCDUMP_SESSION_USER_ID` in
 * `useGscdump.ts`); the route handler always substitutes the caller's real
 * stored gscdump user id when building the upstream request, so the value the
 * browser sends is never trusted or forwarded.
 */
export const GSCDUMP_V1_USER_SCOPED_OPERATION_ID = 'partner.users.sites.available.list'

/**
 * Resolve a browser request against the closed allowlist. Returns `null` for
 * any method/surface/path combination that is not an exact match for one of
 * the registry operations above; the caller must treat `null` as 404, never
 * attempt a raw passthrough.
 */
export function resolveGscdumpV1ProxyOperation(
  method: string,
  surfaceName: string,
  path: string,
): GscdumpV1ProxyOperation | null {
  return resolveHttpOperation(browserOperationEntries, { method, path, surface: surfaceName })
}

/** Extracts the `siteId` path parameter when the resolved operation has one. */
export function getGscdumpV1ProxySiteId(operation: GscdumpV1ProxyOperation): string | null {
  const siteId = (operation.params as Record<string, unknown>).siteId
  return typeof siteId === 'string' ? siteId : null
}

export interface GscdumpV1SiteAccessCandidate {
  /** `sites.ownerId`. Direct ownership always grants access. */
  ownerId: number | null
  /** Every team id the site is linked to via `team_sites`. */
  teamIds: readonly number[]
}

export type GscdumpV1SiteAccessSelection
  = | { _tag: 'site_not_found' }
    | { _tag: 'forbidden' }
    | { _tag: 'allowed' }

/**
 * Decide whether `caller` may use the browser proxy against a resolved site.
 *
 * `site: null` (no row matched the requested gscdump site id) and "caller has
 * no read access to any team the site belongs to" both resolve to
 * `site_not_found`: a caller with no visibility into the site must not be
 * able to distinguish "does not exist" from "exists, not yours" by response
 * shape. `forbidden` is only returned once the caller has already cleared the
 * read check, for a write operation their role doesn't permit.
 */
export function selectGscdumpV1SiteAccess(
  caller: Caller,
  site: GscdumpV1SiteAccessCandidate | null,
  requiresWrite: boolean,
): GscdumpV1SiteAccessSelection {
  if (!site)
    return { _tag: 'site_not_found' }

  const isOwner = caller.isAdmin || site.ownerId === caller.user.id
  const canRead = isOwner || site.teamIds.some(teamId => callerCan(caller, teamId, 'read-data'))
  if (!canRead)
    return { _tag: 'site_not_found' }

  if (!requiresWrite)
    return { _tag: 'allowed' }

  const canWrite = isOwner || site.teamIds.some(teamId => callerCan(caller, teamId, 'write-data'))
  return canWrite ? { _tag: 'allowed' } : { _tag: 'forbidden' }
}

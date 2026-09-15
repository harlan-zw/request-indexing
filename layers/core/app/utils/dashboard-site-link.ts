/**
 * Builds a `/pro/dashboard/sites/:id/...` link from a fleet row's public id.
 *
 * `GET /api/sites/list` names the public id `siteId` (see `SiteFleetRow`),
 * not `publicId` (the raw `sites` table column) -- a caller that read
 * `site.publicId` off this row got `undefined` and silently linked to
 * `/sites/undefined/...`. Routing every dashboard site link through this
 * function means that typo can only happen once.
 */
export function dashboardSiteHref(siteId: string, path: string): string {
  return `/pro/dashboard/sites/${encodeURIComponent(siteId)}/${path}`
}

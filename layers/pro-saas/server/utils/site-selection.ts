// Resolves a picker's selected public ids against the sites the caller may
// pick. A selection that names a site the query did not return is an error
// at the boundary, never a silent drop: dropping it once cleared every link
// on a team when the picker posted `undefined` ids.
export type SiteSelection
  = | { _tag: 'Resolved', siteIds: string[] }
    | { _tag: 'UnknownSites', unknown: string[] }

export function resolveSiteSelection(
  selected: readonly string[],
  found: ReadonlyArray<{ id: string, publicId: string }>,
): SiteSelection {
  const byPublicId = new Map(found.map(site => [site.publicId, site.id]))
  const unknown = selected.filter(publicId => !byPublicId.has(publicId))
  if (unknown.length)
    return { _tag: 'UnknownSites', unknown }
  const siteIds = [...new Set(selected.map(publicId => byPublicId.get(publicId)!))]
  return { _tag: 'Resolved', siteIds }
}

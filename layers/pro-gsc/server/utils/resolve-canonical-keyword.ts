import type { BuilderState } from '@gscdump/contracts'
import { eq, query as queryCol } from '@gscdump/sdk/query'
import { useGscdumpClient } from './gscdump-client'

/**
 * Resolve a user-supplied keyword to the canonical form gscdump uses when
 * grouping by `query_canonical` (see ~/pkg/gscdump compiler.ts buildExtrasQueries).
 *
 * Returns the canonical string if the keyword exists in the site's GSC data,
 * otherwise null. Caller decides fallback (typically: lowercase-trim the input).
 *
 * Lives in pro-gsc as an Integration lookup, not a Site Signal — it is a one-shot
 * keyword resolver, not a typed observation. See docs/adr/0003.
 */
export async function resolveCanonicalKeyword(
  gscdumpSiteId: string,
  keyword: string,
): Promise<string | null> {
  const trimmed = keyword.trim()
  if (!trimmed)
    return null

  const state: BuilderState = {
    dimensions: ['queryCanonical'],
    filter: eq(queryCol, trimmed.toLowerCase()),
    orderBy: { column: 'clicks', dir: 'desc' },
    rowLimit: 1,
  }

  const result = await useGscdumpClient().getData(gscdumpSiteId, state).catch(() => null)
  const canonical = result?.rows?.[0]?.queryCanonical
  return typeof canonical === 'string' && canonical.length > 0 ? canonical : null
}

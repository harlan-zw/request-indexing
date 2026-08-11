import { pickBestGscProperty } from 'gscdump'
import { logWarn } from '~~/shared/logging'
import { useGscdumpClient } from './gscdump-client'

/**
 * Look up a GSC property URL that matches the given site origin for a user.
 * Returns undefined if the user has no gscdump link, no available sites, or no match.
 *
 * Belongs to pro-gsc per ADR-0003 (Integration lifecycle category).
 */
export async function findMatchingGscProperty(
  gscdumpUserId: string | null | undefined,
  origin: string,
): Promise<string | undefined> {
  if (!gscdumpUserId)
    return undefined
  const gscdump = useGscdumpClient()
  const available = await gscdump.getAvailableSites(gscdumpUserId).catch((error) => {
    logWarn('gscdump.proxy.failed', error, { stage: 'available-sites.match', gscdumpUserId })
    return null
  })
  return available ? pickBestGscProperty(origin, available.sites)?.siteUrl : undefined
}

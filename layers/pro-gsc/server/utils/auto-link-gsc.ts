import type { GscdumpAvailableSite } from './gscdump-client'
import { eq } from 'drizzle-orm'
import { isVerifiedGscPermission, matchGscSite, normalizeRegistrationTarget, pickBestGscProperty } from 'gscdump'
import { logWarn } from '~~/shared/logging'
import { sites } from '#layers/pro-saas/server/database'
import { useGscdumpClient } from './gscdump-client'
import { getGscdumpWebhookUrl } from './gscdump-origin'
import { updateOnboardingState } from './onboarding'

/**
 * Auto-link a site to its matching GSC property via gscdump.
 * Finds the matching GSC property, registers if needed, and updates the site row.
 *
 * Returns the gscdumpSiteId if linked, or undefined.
 */
export async function autoLinkGsc(opts: {
  db: ReturnType<typeof useDrizzle>
  gscdumpUserId: string
  siteId: number
  origin: string
  preferredSiteUrl?: string
  /** Pre-fetched available sites (for bulk operations) */
  availableSites?: GscdumpAvailableSite[]
}): Promise<string | undefined> {
  const { db, gscdumpUserId, siteId, origin } = opts
  const gscdump = useGscdumpClient()

  // Idempotency guard: return early if already linked
  const [existing] = await db.select({ gscdumpSiteId: sites.gscdumpSiteId }).from(sites).where(eq(sites.siteId, siteId))
  if (existing?.gscdumpSiteId)
    return existing.gscdumpSiteId

  await gscdump.waitForUserReady(gscdumpUserId).catch((err) => {
    logWarn('auth.optional_probe_failed', err, { stage: 'autoLinkGsc_user_not_ready', gscdumpUserId })
    throw err
  })

  // Use pre-fetched sites or fetch fresh
  const availableSites = opts.availableSites
    ?? await gscdump.getAvailableSites(gscdumpUserId).then(r => r.sites).catch((err) => {
      logWarn('gscdump.teams.client_failed', err, { stage: 'getAvailableSites' })
      return null
    })

  if (!availableSites)
    return undefined

  // Prefer a verified property. Google returns the Domain property first in
  // most accounts, so a naive `.find()` picks `sc-domain:X` even when the user
  // has no access to it — leaving the site auto-linked to a property that can
  // never sync. pickBestGscProperty ranks verified > unverified first.
  const matchingGsc = opts.preferredSiteUrl
    ? availableSites.find(p => p.siteUrl === opts.preferredSiteUrl && matchGscSite(origin, p.siteUrl))
    : pickBestGscProperty(origin, availableSites)
  if (!matchingGsc)
    return undefined

  if (!isVerifiedGscPermission(matchingGsc.permissionLevel)) {
    // Only unverified matches exist. Skip auto-link rather than register a
    // dead-end row; the user will see the property in the "Limited Access"
    // section of the dashboard and can verify it or request access.
    // dev observability: surfaces unverified-match skips
    console.warn('[autoLinkGsc] skipping unverified match for', origin, '-', matchingGsc.siteUrl, matchingGsc.permissionLevel)
    return undefined
  }

  const simpleDomain = normalizeRegistrationTarget(origin)
  if (!simpleDomain)
    return undefined
  let gscdumpSiteId: string | undefined
  let gscdumpSiteUrl: string | undefined

  if (matchingGsc.registered && matchingGsc.siteId) {
    gscdumpSiteId = matchingGsc.siteId
    gscdumpSiteUrl = simpleDomain
  }
  else {
    const result = await gscdump.registerSite({
      userId: gscdumpUserId,
      requestedUrl: simpleDomain,
      gscPropertyUrl: matchingGsc.siteUrl,
      webhookUrl: getGscdumpWebhookUrl(),
    }).catch((err) => {
      logWarn('gscdump.teams.client_failed', err, { stage: 'registerSite' })
      return null
    })

    if (result) {
      gscdumpSiteId = result.siteId
      gscdumpSiteUrl = simpleDomain
    }
  }

  if (gscdumpSiteId) {
    await db.update(sites)
      .set({ gscdumpSiteId, gscdumpSiteUrl })
      .where(eq(sites.siteId, siteId))

    // Update onboarding state to reflect GSC connection
    // Look up the user who owns this site
    const [siteRow] = await db.select({ userId: sites.ownerId }).from(sites).where(eq(sites.siteId, siteId))
    if (siteRow?.userId) {
      await updateOnboardingState(siteRow.userId, {
        setupChecklist: { siteAdded: true, gscConnected: true },
        gscSync: { status: 'connected', connectedAt: new Date().toISOString() },
      }).catch((e: unknown) => logWarn('background.fetch_failed', e, { stage: 'autoLinkGsc_onboarding_update' }))
    }
  }

  return gscdumpSiteId
}

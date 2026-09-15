import type { H3Event } from 'h3'
import type { SiteSelect } from '~~/layers/core/server/db/schema'
import type { CurrentTeamContext } from './require-current-team'
import { and, eq } from 'drizzle-orm'
import { dispatchEvent } from '#domain-events/server'
import { sites } from '#layers/pro-saas/server/database'
import { parseSiteUrlInput } from '#layers/pro-saas/shared/site-url'
import { checkTeamSiteSelection } from './team-site-limit'

export interface RegisterSiteInput {
  /** What the user typed, or the Search Console property the picker handed over. */
  url: string
}

export type RegisterSiteResult
  = | { _tag: 'Ok', site: SiteSelect, isNew: boolean }
    | { _tag: 'InvalidUrl', message: string }
    | { _tag: 'AlreadyConnected', site: SiteSelect }
    | { _tag: 'OverLimit', selected: number, max: number }

/**
 * Register a Site from its address, then let Google Search Console catch up.
 *
 * This is nuxtseo.com's order, and it is the reverse of what this app used to
 * do. Picking a Search Console property first meant a user with no verified
 * property had nothing to pick and no way forward. The address is the identity;
 * the `pro:site:added` listener in pro-gsc matches a property to it and calls
 * gscdump's `registerSite` afterwards, so an unverified account still gets a
 * Site and can verify later.
 */
export async function registerSite(
  event: H3Event,
  ctx: CurrentTeamContext,
  input: RegisterSiteInput,
): Promise<RegisterSiteResult> {
  const { db, caller, team } = ctx

  const parsed = parseSiteUrlInput(input.url)
  if (parsed._tag === 'Err')
    return { _tag: 'InvalidUrl', message: parsed.message }

  const existing = await db.select()
    .from(sites)
    .where(and(eq(sites.teamId, team.teamId), eq(sites.domain, parsed.domain)))
    .get()
  if (existing)
    return { _tag: 'AlreadyConnected', site: existing }

  const owned = await db.select({ id: sites.id })
    .from(sites)
    .where(eq(sites.teamId, team.teamId))
    .all()

  const limit = checkTeamSiteSelection(owned.length + 1)
  if (limit._tag === 'OverLimit')
    return { _tag: 'OverLimit', selected: limit.selected, max: limit.max }

  // `onConflictDoNothing` rather than a bare insert: the read above and the
  // insert are two statements, so a double submit could land both and answer
  // the second with a raw constraint error the user reads as a 500. Losing the
  // race now means the other request already connected the site.
  const [site] = await db.insert(sites).values({
    teamId: team.teamId,
    ownerId: caller.user.id,
    // `property` is the Search Console identifier once a property is linked. It
    // starts as the address so the column is never null for a Site whose
    // property has not been matched yet.
    property: parsed.origin,
    domain: parsed.domain,
    active: true,
  }).onConflictDoNothing().returning()

  if (!site) {
    const raced = await db.select()
      .from(sites)
      .where(and(eq(sites.teamId, team.teamId), eq(sites.domain, parsed.domain)))
      .get()
    if (raced)
      return { _tag: 'AlreadyConnected', site: raced }
    throw new Error('Failed to create site')
  }

  // Fan out so Search Console links itself to the new Site. The listener is
  // isolated, so a Google failure leaves the Site registered rather than
  // failing the whole request.
  await dispatchEvent('pro:site:added', {
    event,
    siteId: site.id,
    teamId: team.teamId,
    url: parsed.origin,
    userId: caller.user.id,
    isNew: true,
  })

  return { _tag: 'Ok', site, isNew: true }
}

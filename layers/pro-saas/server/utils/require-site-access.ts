import type { H3Event } from 'h3'
import type { Site, TeamRole } from '#layers/pro-saas/server/database'
import type { Ability } from '../../shared/policies/team-policy'
import type { SiteRef } from '../../shared/site-access'
import { eq } from 'drizzle-orm'
import { sites } from '#layers/pro-saas/server/database'
import { normalizeSiteRef, resolveSiteAccess } from '../../shared/site-access'
import { requireCaller } from './get-caller'

export interface RequireSiteAccessOptions {
  ability?: Ability
  admin?: boolean
}

function siteNotFound() {
  // One message for "no such site" and "not your team's site", so the boundary
  // never tells a stranger which site ids exist.
  return createError({ statusCode: 404, message: 'Site not found' })
}

async function findSite(db: ReturnType<typeof useDrizzle>, ref: SiteRef) {
  if (ref._tag === 'Uuid')
    return db.select().from(sites).where(eq(sites.id, ref.id)).get()
  if (ref._tag === 'PublicId')
    return db.select().from(sites).where(eq(sites.publicId, ref.publicId)).get()
  return undefined
}

/**
 * Verify the current Caller has access to the site at route param `id`.
 *
 * Team is the single ownership axis, as on nuxtseo.com: `sites.team_id` is
 * NOT NULL and access is the caller's membership of that team. The param may
 * be the canonical UUID or the `s_` public id the browser holds.
 */
export async function requireSiteAccess(
  event: H3Event,
  options?: RequireSiteAccessOptions,
) {
  const caller = await requireCaller(event)
  const db = useDrizzle(event)
  const ref = normalizeSiteRef(getRouterParam(event, 'id') ?? getRouterParam(event, 'siteId'))

  if (ref._tag === 'Missing')
    throw createError({ statusCode: 400, message: 'Missing site ID' })

  const site = await findSite(db, ref)
  if (!site)
    throw siteNotFound()

  const access = resolveSiteAccess({
    siteTeamId: site.teamId,
    memberships: caller.memberships,
    isAdmin: caller.isAdmin,
    adminBypass: options?.admin,
    ability: options?.ability,
  })

  if (access._tag === 'Err') {
    if (access.reason === 'ability-denied')
      throw createError({ statusCode: 403, message: `Requires ability: ${access.ability}` })
    if (access.reason === 'no-owning-team')
      throw createError({ statusCode: 409, message: 'Site has no owning team' })
    throw siteNotFound()
  }

  return {
    caller,
    db,
    site: site as Site,
    siteId: site.id,
    teamId: access.teamId,
    isOwner: access.isOwner,
    role: access.role as TeamRole | null,
  }
}

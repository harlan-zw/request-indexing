import type { H3Event } from 'h3'
import type { Site, TeamRole } from '#layers/pro-saas/server/database'
import type { Ability } from '../../shared/policies/team-policy'
import { eq } from 'drizzle-orm'
import { sites } from '#layers/pro-saas/server/database'
import { can } from '../../shared/policies/team-policy'
import { requireCaller } from './get-caller'

export interface RequireSiteAccessOptions {
  ability?: Ability
  admin?: boolean
}

/**
 * Verify the current Caller has access to the site at route param `id`.
 *
 * V1: core `sites` is owner-scoped (`sites.ownerId` → users.userId). The
 * team→site relation lives on `team_sites` and is consulted by pro-gsc.
 * This helper only validates direct ownership; team-scoped site access will
 * be reintroduced once V1 portfolio dashboard ships.
 */
export async function requireSiteAccess(
  event: H3Event,
  options?: RequireSiteAccessOptions,
) {
  const caller = await requireCaller(event)
  const db = useDrizzle(event)
  const siteIdParam = getRouterParam(event, 'id')

  if (!siteIdParam)
    throw createError({ statusCode: 400, message: 'Missing site ID' })

  const siteIdNum = Number(siteIdParam)
  if (!Number.isFinite(siteIdNum))
    throw createError({ statusCode: 400, message: 'Invalid site ID' })

  const site = await db.select().from(sites).where(eq(sites.siteId, siteIdNum)).get()
  if (!site)
    throw createError({ statusCode: 404, message: 'Site not found' })

  const adminBypass = !!options?.admin && caller.isAdmin

  if (!adminBypass && site.ownerId !== caller.user.id)
    throw createError({ statusCode: 404, message: 'Site not found' })

  if (options?.ability && !can({ isOwner: true, role: null }, options.ability))
    throw createError({ statusCode: 403, message: `Requires ability: ${options.ability}` })

  return {
    caller,
    db,
    site: site as Site,
    siteId: site.siteId,
    isOwner: true,
    role: null as TeamRole | null,
  }
}

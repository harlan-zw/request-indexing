// Pure, isomorphic Site reference resolution and Team access decision.
//
// Kept in shared/ so it carries no database or H3 dependency: the server shell
// (`server/utils/require-site-access.ts`) does the two reads, this file makes
// every decision. Mirrors nuxtseo.com, where `sites.team_id` is the single
// ownership axis and the URL carries `sites.public_id`.

import type { Ability, TeamRole } from './policies/team-policy'
import { can } from './policies/team-policy'

/** The `s_` prefix nuxtseo.com puts on a Site's URL identity. */
export const SITE_PUBLIC_ID_PREFIX = 's_'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * What a `/sites/:id` route param turned out to be.
 *
 * `Unresolvable` covers the old autoincrement key. A link made before the
 * migration carries an integer that now names nothing, and answering 404 is
 * clearer than looking it up and finding another team's Site.
 */
export type SiteRef
  = | { _tag: 'Missing' }
    | { _tag: 'Uuid', id: string }
    | { _tag: 'PublicId', publicId: string }
    | { _tag: 'Unresolvable', reference: string }

export function normalizeSiteRef(param: string | null | undefined): SiteRef {
  const reference = param?.trim() ?? ''
  if (!reference)
    return { _tag: 'Missing' }

  if (UUID_PATTERN.test(reference))
    return { _tag: 'Uuid', id: reference }

  if (reference.startsWith(SITE_PUBLIC_ID_PREFIX))
    return { _tag: 'PublicId', publicId: reference }

  // A bare nanoid is a link written before the `s_` prefix landed. Prefix it
  // rather than break the bookmark.
  if (/^[a-z0-9]{4,24}$/.test(reference) && !/^\d+$/.test(reference))
    return { _tag: 'PublicId', publicId: `${SITE_PUBLIC_ID_PREFIX}${reference}` }

  return { _tag: 'Unresolvable', reference }
}

export interface SiteAccessMembership {
  teamId: number
  isOwner: boolean
  role: TeamRole | 'owner' | null
}

export interface SiteAccessInput {
  /** `sites.team_id`. Null only for a row written before the column existed. */
  siteTeamId: number | null
  memberships: SiteAccessMembership[]
  isAdmin: boolean
  /** Routes opt in; an admin is not silently a member of every team. */
  adminBypass?: boolean
  ability?: Ability
}

export type SiteAccess
  = | { _tag: 'Ok', teamId: number, isOwner: boolean, role: TeamRole | null }
    | { _tag: 'Err', reason: 'no-owning-team' }
    | { _tag: 'Err', reason: 'not-a-member' }
    | { _tag: 'Err', reason: 'ability-denied', ability: Ability, role: TeamRole | 'owner' | null }

export function resolveSiteAccess(input: SiteAccessInput): SiteAccess {
  const { siteTeamId } = input
  if (siteTeamId === null || siteTeamId === undefined)
    return { _tag: 'Err', reason: 'no-owning-team' }

  const membership = input.memberships.find(item => item.teamId === siteTeamId)

  if (!membership) {
    if (input.adminBypass && input.isAdmin)
      return { _tag: 'Ok', teamId: siteTeamId, isOwner: true, role: null }
    return { _tag: 'Err', reason: 'not-a-member' }
  }

  const isOwner = membership.isOwner
  const role = isOwner || membership.role === 'owner' ? null : (membership.role as TeamRole | null)

  if (input.ability && !can({ isOwner, role }, input.ability))
    return { _tag: 'Err', reason: 'ability-denied', ability: input.ability, role: membership.role }

  return { _tag: 'Ok', teamId: siteTeamId, isOwner, role }
}

import { describe, expect, it } from 'vitest'
import { normalizeSiteRef, resolveSiteAccess } from './site-access'

describe('normalizeSiteRef', () => {
  it('rejects a missing or blank reference', () => {
    expect(normalizeSiteRef(undefined)).toEqual({ _tag: 'Missing' })
    expect(normalizeSiteRef('  ')).toEqual({ _tag: 'Missing' })
  })

  it('reads a canonical uuid as itself', () => {
    expect(normalizeSiteRef('8efd1107-dca5-4e80-aad6-99d98af86ea5'))
      .toEqual({ _tag: 'Uuid', id: '8efd1107-dca5-4e80-aad6-99d98af86ea5' })
  })

  it('reads a prefixed public id as itself', () => {
    expect(normalizeSiteRef('s_kv1109')).toEqual({ _tag: 'PublicId', publicId: 's_kv1109' })
  })

  it('adds the prefix a link made before the migration is missing', () => {
    expect(normalizeSiteRef('kv1109')).toEqual({ _tag: 'PublicId', publicId: 's_kv1109' })
  })

  it('rejects an integer left over from the old key', () => {
    expect(normalizeSiteRef('42')).toEqual({ _tag: 'Unresolvable', reference: '42' })
  })
})

describe('resolveSiteAccess', () => {
  const owner = { teamId: 7, isOwner: true, role: 'owner' as const }
  const viewer = { teamId: 7, isOwner: false, role: 'viewer' as const }

  it('admits the team owner', () => {
    expect(resolveSiteAccess({ siteTeamId: 7, memberships: [owner], isAdmin: false }))
      .toEqual({ _tag: 'Ok', teamId: 7, isOwner: true, role: null })
  })

  it('admits a member of the owning team', () => {
    expect(resolveSiteAccess({ siteTeamId: 7, memberships: [viewer], isAdmin: false }))
      .toEqual({ _tag: 'Ok', teamId: 7, isOwner: false, role: 'viewer' })
  })

  it('refuses someone who belongs to a different team', () => {
    expect(resolveSiteAccess({ siteTeamId: 7, memberships: [{ ...owner, teamId: 9 }], isAdmin: false }))
      .toEqual({ _tag: 'Err', reason: 'not-a-member' })
  })

  it('refuses a site left without an owning team', () => {
    expect(resolveSiteAccess({ siteTeamId: null, memberships: [owner], isAdmin: false }))
      .toEqual({ _tag: 'Err', reason: 'no-owning-team' })
  })

  it('refuses a member whose role lacks the ability', () => {
    expect(resolveSiteAccess({ siteTeamId: 7, memberships: [viewer], isAdmin: false, ability: 'manage-sites' }))
      .toEqual({ _tag: 'Err', reason: 'ability-denied', ability: 'manage-sites', role: 'viewer' })
  })

  it('lets the owner through the same ability', () => {
    expect(resolveSiteAccess({ siteTeamId: 7, memberships: [owner], isAdmin: false, ability: 'manage-sites' }))
      .toEqual({ _tag: 'Ok', teamId: 7, isOwner: true, role: null })
  })

  it('lets an admin bypass membership when the route asks for it', () => {
    expect(resolveSiteAccess({ siteTeamId: 7, memberships: [], isAdmin: true, adminBypass: true }))
      .toEqual({ _tag: 'Ok', teamId: 7, isOwner: true, role: null })
  })

  it('still refuses an admin on a route that did not ask for the bypass', () => {
    expect(resolveSiteAccess({ siteTeamId: 7, memberships: [], isAdmin: true }))
      .toEqual({ _tag: 'Err', reason: 'not-a-member' })
  })
})

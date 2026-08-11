// Pure policy helpers over a Caller. No Nuxt auto-imports, no DB. Test surface
// for the user-context seam: construct a Caller literal, assert behaviour.

import type { Caller } from './caller'

/**
 * Free-only beta: every account gets the same site allowance. Set generously on
 * purpose; the beta is meant to be usable for someone running a handful of
 * sites, not a teaser. Revisit if quota cost against gscdump becomes real.
 */
export const FREE_SITES_LIMIT = 5

export function findMembership(caller: Caller, teamId: number) {
  return caller.memberships.find(m => m.teamId === teamId) ?? null
}

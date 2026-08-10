import type { Ability } from '../../shared/policies/team-policy'
import { callerCan } from '../../shared/policies/team-policy'

/**
 * Reactive team ability check bound to the current Caller. Server-side
 * enforcement (see `layers/pro-saas/server/policies/team.ts`) is authoritative;
 * this is for hide/disable UX only. Pass a string, ref, or getter for teamId.
 */
export function useTeamPolicy(teamId: MaybeRefOrGetter<number | null | undefined>) {
  const { caller } = useCaller()
  return {
    can: (ability: Ability) => {
      const id = toValue(teamId)
      if (!id)
        return false
      return callerCan(caller.value ?? null, id, ability)
    },
  }
}

import type { CallerMembership } from '../../shared/caller'

export interface ProWorkspaceMembership {
  firstVisitDismissedAt: string | null
}

export interface ProWorkspace {
  id: number
  name: string
  personalTeam: boolean
  role: CallerMembership['role']
  isOwner: boolean
  /**
   * `null` for teams the user owns (no pivot row by design). Populated for
   * memberships the user joined via invitation.
   */
  membership: ProWorkspaceMembership | null
}

export function useCurrentWorkspace() {
  const { caller, memberships } = useCaller()
  const proFetch = useProFetch()

  const teams = computed<ProWorkspace[]>(() =>
    memberships.value.map(m => ({
      id: m.teamId,
      name: m.teamName,
      personalTeam: m.isPersonal,
      role: m.role,
      isOwner: m.isOwner,
      membership: m.isOwner
        ? null
        : { firstVisitDismissedAt: m.firstVisitDismissedAt ?? null },
    })),
  )

  const persistedTeamId = computed(() => caller.value?.currentTeamId ?? null)
  const currentTeam = computed<ProWorkspace | null>(() =>
    teams.value.find(t => t.id === persistedTeamId.value) ?? teams.value[0] ?? null,
  )
  const currentTeamId = computed(() => currentTeam.value?.id ?? null)
  const isSolo = computed(() =>
    teams.value.length === 1 && teams.value[0]?.personalTeam,
  )
  const hasSharedTeams = computed(() => teams.value.some(t => !t.personalTeam))

  function teamLabel(team: Pick<ProWorkspace, 'name' | 'personalTeam'>): string {
    return team.personalTeam ? 'Personal' : team.name
  }

  function teamRoleLabel(role: ProWorkspace['role']): string {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  async function switchTeam(teamId: number): Promise<ProWorkspace | null> {
    const target = teams.value.find(t => t.id === teamId) ?? null
    if (!target || teamId === currentTeam.value?.id)
      return target

    await proFetch('/api/pro/teams/current', {
      method: 'PUT',
      body: { teamId },
    })
    await useRefreshCaller()
    await refreshNuxtData()

    return target
  }

  return {
    teams,
    currentTeamId,
    currentTeam,
    isSolo,
    hasSharedTeams,
    teamLabel,
    teamRoleLabel,
    switchTeam,
  }
}

// Caller: the resolved, request-scoped (server) or render-scoped (client) identity
// making the current call. See CONTEXT.md and docs/adr/0002-caller-is-the-user-context-seam.md.

import type { AuthProviderId } from '#layers/pro-saas-auth/shared/types/auth'
import type { TeamRole } from '#layers/pro-saas/shared/types/domain'

export type CallerAuthMethod = 'session' | 'apiKey'

export interface CallerUser {
  id: number
  email: string | null
  name: string | null
  avatarUrl: string | null
  providers: AuthProviderId[]
  apiKey: string | null
  createdAt: string | null
}

export interface CallerMembership {
  teamId: number
  teamName: string
  role: TeamRole | 'owner'
  isOwner: boolean
  isPersonal: boolean
  /**
   * When the user first dismissed the orientation card for this team.
   * `null` for teams the user owns (no `team_memberships` row exists)
   * AND for invitee memberships that have not been dismissed.
   */
  firstVisitDismissedAt: string | null
}

export interface Caller {
  user: CallerUser
  memberships: CallerMembership[]
  /**
   * The user's persisted "last viewed team" selection (`users.currentTeamId`).
   * UX state, not auth state. Routes that include `:teamId` should derive their
   * CurrentTeam from the URL, not from this field. See CONTEXT.md.
   */
  currentTeamId: number | null
  isAdmin: boolean
  authMethod: CallerAuthMethod
}

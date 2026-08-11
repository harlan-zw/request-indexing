import type { H3Event } from 'h3'
import type { User } from '~~/layers/core/server/db/schema'
import type { AuthProviderId } from '#layers/pro-saas-auth/shared/types/auth'

module '#auth-utils' {
  export interface User {
    id: number
    email: string | null
    name: string | null
    avatarUrl: string | null
    authProvider: AuthProviderId
    currentTeamId: number | null
  }
  export interface UserSession {
    apiKey?: string
    /**
     * Current team, populated by the session `fetch` hook. Null when the user
     * has no `currentTeamId`. The dashboard layouts read `team.onboardedStep`
     * to decide whether to push the user through setup.
     */
    team?: {
      teamId: number
      name: string
      personalTeam: boolean
      onboardedStep: string | null
    } | null
  }
}

module 'nitropack' {
  export interface NitroRuntimeHooks {
    'app:signUp': (event: H3Event, user: User) => void
  }
}

export {}

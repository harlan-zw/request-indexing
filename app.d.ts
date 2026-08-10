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
  }
}

module 'nitropack' {
  export interface NitroRuntimeHooks {
    'app:signUp': (event: H3Event, user: User) => void
  }
}

export {}

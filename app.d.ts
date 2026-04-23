import type { H3Event } from 'h3'
import type { User } from '~/types'

module '#auth-utils' {
  export interface UserSession {
    user?: {
      userId: string
      picture: string
      indexingTokenId?: string
    }
  }
}

module 'nitropack' {
  export interface NitroRuntimeHooks {
    'app:signUp': (event: H3Event, user: User) => void
  }
}

export {}

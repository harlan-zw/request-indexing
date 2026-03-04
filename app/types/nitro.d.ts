import type { NitroAuthData } from '~/types/auth'

declare module 'h3' {
  export interface H3EventContext {
    authenticatedData: NitroAuthData
  }
}

export {}

import type { Credentials } from 'google-auth-library'
import type { RequiredNonNullable } from '~/types/util'

export interface NitroAuthData {
  tokens: TokenPayload['tokens']
  user: User
}

export interface TokenPayload {
  updatedAt: number
  sub: string
  tokens: RequiredNonNullable<Credentials>
}

export interface OAuthPoolToken {
  id: string
  users: string[]
  client_id: string
  client_secret: string
}

export interface User {
  userId: string
  picture: string
  indexingApiQuota: number
  indexingOAuthId?: string
  lastIndexingOAuthId?: string
  analyticsPeriod: string
  hiddenSites?: string[]
}

export interface UserSession {
  sub: string
  user: User
  // used when redirecting to Web Indexing API OAuth
  googleIndexingAuth?: {
    referrer: string
    state: string
  }
}

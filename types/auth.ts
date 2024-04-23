import type { Credentials } from 'google-auth-library'
import type { RequiredNonNullable } from '~/types/util'

export interface NitroAuthData {
  tokens: TokenPayload['tokens']
  user: User
}

export type UserOAuthToken = RequiredNonNullable<Credentials>

export interface TokenPayload {
  updatedAt: number
  sub: string
  tokens: RequiredNonNullable<UserOAuthToken>
}

export interface OAuthPoolPayload {
  id: string
  users: string[]
}

export interface OAuthPoolToken {
  id: string
  client_id: string
  client_secret: string
  label: string
}

export interface UserQuota {
  indexingApi: number
}

export interface User {
  email: string
  quota: UserQuota
  userId: string
  access?: 'pro'
  picture: string
  // legacy
  indexingOAuthId?: string
  indexingOAuthIdNext?: string
  lastIndexingOAuthIdNext?: string
  analyticsPeriod: string
  hiddenSites?: string[]
}

export interface UserSession {
  sub: string
  user: User
  // used when redirecting to Web Indexing API OAuth
  googleIndexingAuth?: {
    indexingOAuthId: string
    referrer: string
    state: string
  }
}

import type { Credentials } from 'google-auth-library'
import type { RequiredNonNullable } from '~/types/util'
import type { UserSelect } from '~/server/database/schema'

export interface NitroAuthData {
  tokens: UserModel['loginTokens']
  user: UserModel
}

export type UserOAuthToken = RequiredNonNullable<Credentials>

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

// export interface User {
//   email: string
//   userId: string
//   access?: 'pro'
//   picture: string
//   indexingOAuthId?: string
//   lastIndexingOAuthId?: string
//   analyticsRange?: { start: Date, end: Date }
//   analyticsPeriod?: 'all' | '30d' | string
//   // onboarding
//   selectedSites?: string[]
//   backupsEnabled?: boolean
// }

export interface UserSession {
  sessionId: number
  sub: string
  user: UserSelect
  // used when redirecting to Web Indexing API OAuth
  googleIndexingAuth?: {
    indexingOAuthId: string
    referrer: string
    state: string
  }
}

// Caller: the resolved, request-scoped (server) or render-scoped (client) identity
// making the current call. See CONTEXT.md and docs/adr/0002-caller-is-the-user-context-seam.md.

import type { AuthProviderId } from '#layers/pro-saas-auth/shared/types/auth'
import type { TeamRole } from '#layers/pro-saas/shared/types/domain'

// V1 pricing — Free / Pro $29 / Growth $99 / Scale $299. `lifetime` removed
// (was nuxtseo.com lifetime grant; V1 has no equivalent). `starter` removed.
// See V1.md line 137-146.
export type CallerSubscriptionStatus
  = | 'free'
    | 'trial'
    | 'active'
    | 'past_due'
    | 'paused'
    | 'canceled'
    | 'read_only'
    | 'archived'
export type CallerPlan = 'free' | 'pro' | 'growth' | 'scale'
export type CallerSubscriptionTier = 'pro' | 'growth' | 'scale'
export type CallerBillingCycle = 'monthly' | 'annual'
export type CallerAuthMethod = 'session' | 'apiKey'

export interface CallerUser {
  id: number
  email: string | null
  name: string | null
  avatarUrl: string | null
  providers: AuthProviderId[]
  stripeEmail: string | null
  apiKey: string | null
  createdAt: string | null
}

export interface CallerSubscription {
  status: CallerSubscriptionStatus
  plan: CallerPlan
  tier: CallerSubscriptionTier | null
  billingCycle: CallerBillingCycle | null
  sitesLimit: number | null
  /** V1 per-tier daily LLM citation prompt quota: Free 10 / Pro 100 / Growth 500 / Scale 2000. */
  promptsLimit: number | null
  /** V1 gate: MCP host access (Pro+). */
  mcpEnabled: boolean
  /** V1 gate: REST API access (Growth+). */
  apiAccessEnabled: boolean
  stripeCustomerId: string | null
  cancelAtPeriodEnd: boolean
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  readOnlyUntil: string | null
  archivedAt: string | null
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
  subscription: CallerSubscription
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

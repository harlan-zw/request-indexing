// Pure policy helpers over a Caller. No Nuxt auto-imports, no DB. Test surface
// for the user-context seam: construct a Caller literal, assert behaviour.

import type {
  Caller,
  CallerBillingCycle,
  CallerPlan,
  CallerSubscription,
  CallerSubscriptionStatus,
  CallerSubscriptionTier,
} from './caller'

// V1 per-tier defaults — V1.md line 137-146.
const TIER_SITES_LIMIT: Record<CallerPlan, number> = { free: 1, pro: 3, growth: 10, scale: 50 }
const TIER_PROMPTS_LIMIT: Record<CallerPlan, number> = { free: 10, pro: 100, growth: 500, scale: 2000 }

const PRO_STATUSES: ReadonlySet<CallerSubscriptionStatus> = new Set(['trial', 'active'])
const READ_ONLY_STATUSES: ReadonlySet<CallerSubscriptionStatus> = new Set(['paused', 'read_only', 'archived'])
const WRITE_STATUSES: ReadonlySet<CallerSubscriptionStatus> = new Set(['trial', 'active'])

const VALID_STATUSES: ReadonlySet<CallerSubscriptionStatus> = new Set([
  'free',
  'trial',
  'active',
  'past_due',
  'paused',
  'canceled',
  'read_only',
  'archived',
])

export interface UserSubscriptionFields {
  subscriptionStatus: string | null
  subscriptionTier: string | null
  billingCycle: string | null
  sitesLimit: number | null
  promptsLimit: number | null
  stripeCustomerId: string | null
  cancelAtPeriodEnd: boolean | null
  trialEndsAt: Date | null
  currentPeriodEnd: Date | null
  readOnlyUntil: Date | null
  archivedAt: Date | null
}

function isoOrNull(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null
}

function planFromTier(tier: CallerSubscriptionTier | null, status: CallerSubscriptionStatus): CallerPlan {
  if (!tier || !PRO_STATUSES.has(status))
    return 'free'
  return tier
}

export function deriveSubscription(user: UserSubscriptionFields): CallerSubscription {
  const raw = user.subscriptionStatus ?? null
  const status: CallerSubscriptionStatus = (raw && VALID_STATUSES.has(raw as CallerSubscriptionStatus))
    ? (raw as CallerSubscriptionStatus)
    : 'free'

  const tier: CallerSubscriptionTier | null
    = user.subscriptionTier === 'pro' || user.subscriptionTier === 'growth' || user.subscriptionTier === 'scale'
      ? user.subscriptionTier
      : null

  const billingCycle: CallerBillingCycle | null
    = user.billingCycle === 'monthly' || user.billingCycle === 'annual'
      ? user.billingCycle
      : null

  const plan = planFromTier(tier, status)

  return {
    status,
    plan,
    tier,
    billingCycle,
    sitesLimit: user.sitesLimit ?? TIER_SITES_LIMIT[plan],
    promptsLimit: user.promptsLimit ?? TIER_PROMPTS_LIMIT[plan],
    mcpEnabled: plan !== 'free',
    apiAccessEnabled: plan === 'growth' || plan === 'scale',
    stripeCustomerId: user.stripeCustomerId,
    cancelAtPeriodEnd: !!user.cancelAtPeriodEnd,
    trialEndsAt: isoOrNull(user.trialEndsAt),
    currentPeriodEnd: isoOrNull(user.currentPeriodEnd),
    readOnlyUntil: isoOrNull(user.readOnlyUntil),
    archivedAt: isoOrNull(user.archivedAt),
  }
}

export function hasProAccess(caller: Caller, _plan: CallerPlan = 'pro'): boolean {
  if (caller.isAdmin)
    return true
  return PRO_STATUSES.has(caller.subscription.status)
}

export function isReadOnly(caller: Caller): boolean {
  return READ_ONLY_STATUSES.has(caller.subscription.status)
}

export function canWrite(caller: Caller): boolean {
  return WRITE_STATUSES.has(caller.subscription.status)
}

export function findMembership(caller: Caller, teamId: number) {
  return caller.memberships.find(m => m.teamId === teamId) ?? null
}

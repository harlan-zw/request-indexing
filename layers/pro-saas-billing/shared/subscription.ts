export const BILLING_SUBSCRIPTION_STATUSES = [
  'free',
  'trial',
  'active',
  'past_due',
  'paused',
  'canceled',
  'read_only',
  'archived',
] as const

export type BillingSubscriptionStatus = typeof BILLING_SUBSCRIPTION_STATUSES[number]
export type BillingSubscriptionTier = 'pro' | 'growth' | 'scale'
export type BillingCycle = 'monthly' | 'annual'
export type BillingPlan = 'free' | BillingSubscriptionTier
export type BillingChangeIntent = 'start_trial' | 'upgrade' | 'downgrade' | 'reactivate' | 'update_payment_method' | 'cancel' | 'none'
export type BillingActionMode = 'checkout' | 'portal' | 'none'

export interface BillingLifecycleInput {
  status: string | null | undefined
  tier?: string | null
  cancelAtPeriodEnd?: boolean | null
  stripeCustomerId?: string | null
}

export interface BillingLifecycle {
  status: BillingSubscriptionStatus
  plan: BillingPlan
  tier: BillingSubscriptionTier | null
  canStartTrial: boolean
  canUsePortal: boolean
  canWrite: boolean
  isReadOnly: boolean
  isSubscriber: boolean
  primaryIntent: BillingChangeIntent
}

export interface BillingAction {
  mode: BillingActionMode
  intent: BillingChangeIntent
}

export function normalizeBillingStatus(status: string | null | undefined): BillingSubscriptionStatus {
  if (!status)
    return 'free'
  if (status === 'trialing')
    return 'trial'
  if (status === 'unpaid')
    return 'past_due'
  return BILLING_SUBSCRIPTION_STATUSES.includes(status as BillingSubscriptionStatus)
    ? status as BillingSubscriptionStatus
    : 'free'
}

export function normalizeBillingTier(tier: string | null | undefined): BillingSubscriptionTier | null {
  return tier === 'pro' || tier === 'growth' || tier === 'scale' ? tier : null
}

export function resolveBillingLifecycle(input: BillingLifecycleInput): BillingLifecycle {
  const status = normalizeBillingStatus(input.status)
  const tier = normalizeBillingTier(input.tier)
  const isSubscriber = status === 'trial' || status === 'active'
  const isReadOnly = status === 'paused' || status === 'read_only' || status === 'archived'
  const canWrite = status === 'trial' || status === 'active'
  const canUsePortal = !!input.stripeCustomerId
  const canStartTrial = status === 'free' || status === 'canceled' || status === 'archived'

  let primaryIntent: BillingChangeIntent = 'none'
  if (status === 'free')
    primaryIntent = 'start_trial'
  else if (status === 'past_due')
    primaryIntent = 'update_payment_method'
  else if (status === 'paused' || status === 'read_only' || status === 'archived' || status === 'canceled')
    primaryIntent = 'reactivate'
  else if (input.cancelAtPeriodEnd)
    primaryIntent = 'reactivate'
  else if (status === 'trial' || status === 'active')
    primaryIntent = 'upgrade'

  return {
    status,
    plan: tier ?? 'free',
    tier,
    canStartTrial,
    canUsePortal,
    canWrite,
    isReadOnly,
    isSubscriber,
    primaryIntent,
  }
}

export function resolveBillingAction(lifecycle: BillingLifecycle): BillingAction {
  if (lifecycle.canUsePortal && lifecycle.status !== 'free')
    return { mode: 'portal', intent: lifecycle.primaryIntent }

  if (lifecycle.canStartTrial)
    return { mode: 'checkout', intent: 'start_trial' }

  return { mode: 'none', intent: lifecycle.primaryIntent }
}

export function lookupKeyForTierCycle(
  tier: BillingSubscriptionTier,
  cycle: BillingCycle,
  config: {
    stripePriceLookupProMonthly?: string
    stripePriceLookupProAnnual?: string
    stripePriceLookupGrowthMonthly?: string
    stripePriceLookupGrowthAnnual?: string
    stripePriceLookupScaleMonthly?: string
    stripePriceLookupScaleAnnual?: string
  },
): string {
  if (tier === 'scale') {
    return cycle === 'annual' ? config.stripePriceLookupScaleAnnual || 'scale_annual' : config.stripePriceLookupScaleMonthly || 'scale_monthly'
  }
  if (tier === 'growth') {
    return cycle === 'annual' ? config.stripePriceLookupGrowthAnnual || 'growth_annual' : config.stripePriceLookupGrowthMonthly || 'growth_monthly'
  }
  return cycle === 'annual' ? config.stripePriceLookupProAnnual || 'pro_annual' : config.stripePriceLookupProMonthly || 'pro_monthly'
}

// Reactive view of the user's subscription state. Sources from useCaller (the
// validated user-context seam) rather than the session cookie — per ADR-0001
// the cookie is a cache, not truth.

import type { BillingSubscriptionStatus } from '../../shared/subscription'
import {
  canWrite as policyCanWrite,
  isReadOnly as policyIsReadOnly,
} from '#layers/pro-saas/shared/caller-policy'
import { resolveBillingLifecycle } from '../../shared/subscription'

export type ProSubscriptionStatus
  = | Exclude<BillingSubscriptionStatus, 'free'>
    | null

export type ProTrialUrgency = 'normal' | 'warning' | 'critical'

function parseDate(value: string | null): Date | null {
  if (!value)
    return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(0, Math.ceil((a.getTime() - b.getTime()) / 86_400_000))
}

// Pure derivation over `useCaller()` (a deduped `useFetch`); safe to call from
// any setup or interceptor. `useTrialState()` remains as a compatibility alias.
export function useBillingState() {
  const { caller, subscription } = useCaller()

  const subscriptionStatus = computed<ProSubscriptionStatus>(() => {
    const s = lifecycle.value.status
    if (s === 'free')
      return null
    return s
  })

  const lifecycle = computed(() => resolveBillingLifecycle({
    status: subscription.value?.status,
    tier: subscription.value?.tier,
    cancelAtPeriodEnd: subscription.value?.cancelAtPeriodEnd,
    stripeCustomerId: subscription.value?.stripeCustomerId,
  }))

  const subscriptionTier = computed(() => subscription.value?.tier ?? null)
  const billingCycle = computed(() => subscription.value?.billingCycle ?? null)
  const sitesLimit = computed(() => subscription.value?.sitesLimit ?? null)
  const cancelAtPeriodEnd = computed(() => !!subscription.value?.cancelAtPeriodEnd)

  const trialEndsAt = computed(() => parseDate(subscription.value?.trialEndsAt ?? null))
  const currentPeriodEnd = computed(() => parseDate(subscription.value?.currentPeriodEnd ?? null))
  const readOnlyUntil = computed(() => parseDate(subscription.value?.readOnlyUntil ?? null))
  const archivedAt = computed(() => parseDate(subscription.value?.archivedAt ?? null))

  // Recompute days based on a tick so urgency transitions live without reload.
  // SSR returns a fixed snapshot; client refreshes once a minute.
  const now = ref<Date>(new Date())
  if (import.meta.client) {
    const interval = setInterval(() => {
      now.value = new Date()
    }, 60_000)
    onScopeDispose(() => clearInterval(interval))
  }

  const isTrialActive = computed(() => {
    if (subscriptionStatus.value !== 'trial')
      return false
    const end = trialEndsAt.value
    return !end || end.getTime() > now.value.getTime()
  })

  const daysLeftInTrial = computed(() => {
    const end = trialEndsAt.value
    return end ? daysBetween(end, now.value) : 0
  })

  const daysUntilArchive = computed(() => {
    const until = readOnlyUntil.value
    return until ? daysBetween(until, now.value) : 0
  })

  const isReadOnly = computed(() => !!caller.value && policyIsReadOnly(caller.value))
  const canWrite = computed(() => !!caller.value && policyCanWrite(caller.value))

  // Drives <ProTrialBanner> color + dismissability per UX P1.1.
  // T>7d normal · T 4-7d warning · T<=3d critical (non-dismissable).
  const urgency = computed<ProTrialUrgency>(() => {
    if (!isTrialActive.value)
      return 'normal'
    const d = daysLeftInTrial.value
    if (d <= 3)
      return 'critical'
    if (d <= 7)
      return 'warning'
    return 'normal'
  })

  const upgradeReasonForCurrentState = computed<
    'trial_paused' | 'read_only' | 'archived' | null
  >(() => {
    const s = subscriptionStatus.value
    if (s === 'paused')
      return 'trial_paused'
    if (s === 'read_only')
      return 'read_only'
    if (s === 'archived')
      return 'archived'
    return null
  })

  return {
    subscriptionStatus,
    subscriptionTier,
    billingCycle,
    sitesLimit,
    cancelAtPeriodEnd,
    trialEndsAt,
    currentPeriodEnd,
    readOnlyUntil,
    archivedAt,
    isTrialActive,
    daysLeftInTrial,
    daysUntilArchive,
    isReadOnly,
    canWrite,
    urgency,
    upgradeReasonForCurrentState,
    lifecycle,
  }
}

export function useTrialState() {
  return useBillingState()
}

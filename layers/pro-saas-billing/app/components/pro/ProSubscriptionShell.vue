<script setup lang="ts">
// Renders the right state banner per useTrialState() and globally mounts
// <ProUpgradeModal> hooked to useUpgradeModal(). Mount once at the top of
// the pro-dashboard layout. All openPortal events route to /api/pro/billing/portal
// (Stripe Customer Portal owns plan switch + cancel + payment method).
import ProCanceledBanner from './ProCanceledBanner.vue'
import ProPastDueBanner from './ProPastDueBanner.vue'
import ProPausedBanner from './ProPausedBanner.vue'
import ProReadOnlyBanner from './ProReadOnlyBanner.vue'
import ProTrialBanner from './ProTrialBanner.vue'
import ProUpgradeModal from './ProUpgradeModal.vue'

const toast = useToast()
const upgradeModal = useUpgradeModal()
const proFetch = useProFetch()
const { fetch: refreshSession } = useUserSession()

// Engagement-event toasts (gsc_connected, first_sync_complete, welcome, etc.)
useProEngagementToasts()

const {
  subscriptionStatus,
  isTrialActive,
  trialEndsAt,
  daysLeftInTrial,
  daysUntilArchive,
  readOnlyUntil,
  currentPeriodEnd,
  subscriptionTier,
} = useTrialState()

const portalLoading = ref(false)

async function openPortal() {
  if (portalLoading.value)
    return
  portalLoading.value = true
  await proFetch<{ url?: string }>('/api/pro/billing/portal', { method: 'POST' })
    .then((res) => {
      if (res?.url)
        window.location.href = res.url
    })
    .catch((e: any) => {
      toast.add({
        title: 'Could not open billing portal',
        description: e?.data?.message || e?.message,
        color: 'error',
      })
    })
    .finally(() => {
      portalLoading.value = false
    })
}

const trialBannerProps = computed(() => {
  if (!isTrialActive.value || !trialEndsAt.value)
    return null
  return {
    daysLeft: daysLeftInTrial.value,
    trialEndsAt: trialEndsAt.value,
  }
})

const canceledBannerProps = computed(() => {
  if (subscriptionStatus.value !== 'canceled' || !currentPeriodEnd.value)
    return null
  const ms = currentPeriodEnd.value.getTime() - Date.now()
  return {
    currentPeriodEnd: currentPeriodEnd.value,
    daysRemaining: Math.max(0, Math.ceil(ms / 86_400_000)),
  }
})

const readOnlyBannerProps = computed(() => {
  if (subscriptionStatus.value !== 'read_only')
    return null
  return {
    readOnlyUntil: readOnlyUntil.value ?? new Date(Date.now() + 14 * 86_400_000),
    daysRemaining: daysUntilArchive.value,
  }
})

// When the user picks a tier in the modal, route through the right Stripe
// flow: free-tier users hit /api/pro/billing/checkout (Checkout); existing
// subscribers go through Customer Portal where Stripe handles plan switch.
const startTrialLoading = ref(false)

async function onSelectTier(payload: { tier: 'free' | 'pro' | 'growth' | 'scale', cycle: 'monthly' | 'annual' }) {
  if (payload.tier === 'free') {
    upgradeModal.close()
    return
  }
  // Existing subscriber → Portal handles plan switch.
  if (subscriptionTier.value || subscriptionStatus.value === 'past_due'
    || subscriptionStatus.value === 'paused' || subscriptionStatus.value === 'read_only'
    || subscriptionStatus.value === 'canceled' || subscriptionStatus.value === 'archived') {
    upgradeModal.close()
    await openPortal()
    return
  }
  // Net-new trial → Stripe Checkout in subscription mode.
  if (startTrialLoading.value)
    return
  startTrialLoading.value = true
  await proFetch<{ url?: string, alreadyStarted?: boolean }>('/api/pro/billing/checkout', {
    method: 'POST',
    body: { tier: payload.tier, cycle: payload.cycle },
  })
    .then(async (res) => {
      if (res?.url) {
        window.location.href = res.url
        return
      }
      if (res?.alreadyStarted) {
        upgradeModal.close()
        await refreshSession()
      }
    })
    .catch((e: any) => {
      toast.add({
        title: 'Could not start trial',
        description: e?.data?.message || e?.message,
        color: 'error',
      })
    })
    .finally(() => {
      startTrialLoading.value = false
    })
}

const modalCurrentTier = computed<'free' | 'pro' | 'growth' | 'scale' | null>(() => {
  if (subscriptionTier.value === 'scale')
    return 'scale'
  if (subscriptionTier.value === 'growth')
    return 'growth'
  if (subscriptionTier.value === 'pro')
    return 'pro'
  return 'free'
})

// Pro on a sites_cap reason → suggest growth. Otherwise default to pro.
const modalSuggestedTier = computed<'pro' | 'growth' | 'scale'>(() => {
  if (upgradeModal.reason.value === 'sites_cap' && modalCurrentTier.value === 'pro')
    return 'growth'
  return upgradeModal.suggestedTier.value as 'pro' | 'growth' | 'scale'
})

const modalOpen = computed({
  get: () => upgradeModal.isOpen.value,
  set: v => upgradeModal.setOpen(v),
})
</script>

<template>
  <ClientOnly>
    <div v-if="trialBannerProps || subscriptionStatus === 'past_due' || subscriptionStatus === 'paused' || subscriptionStatus === 'canceled' || subscriptionStatus === 'read_only'" class="px-4 lg:px-6 pt-3 space-y-2">
      <ProTrialBanner
        v-if="trialBannerProps"
        :days-left="trialBannerProps.daysLeft"
        :trial-ends-at="trialBannerProps.trialEndsAt"
        @open-portal="openPortal"
      />
      <ProPastDueBanner
        v-if="subscriptionStatus === 'past_due'"
        @open-portal="openPortal"
      />
      <ProPausedBanner
        v-if="subscriptionStatus === 'paused'"
        @open-portal="openPortal"
      />
      <ProCanceledBanner
        v-if="canceledBannerProps"
        :current-period-end="canceledBannerProps.currentPeriodEnd"
        :days-remaining="canceledBannerProps.daysRemaining"
        @open-portal="openPortal"
      />
      <ProReadOnlyBanner
        v-if="readOnlyBannerProps"
        :read-only-until="readOnlyBannerProps.readOnlyUntil"
        :days-remaining="readOnlyBannerProps.daysRemaining"
        @open-portal="openPortal"
      />
    </div>

    <ProUpgradeModal
      v-model:open="modalOpen"
      :reason="upgradeModal.reason.value"
      :current-tier="modalCurrentTier"
      :suggested-tier="modalSuggestedTier"
      :current-sites-limit="upgradeModal.currentSitesLimit.value"
      @select-tier="onSelectTier"
    />
  </ClientOnly>
</template>

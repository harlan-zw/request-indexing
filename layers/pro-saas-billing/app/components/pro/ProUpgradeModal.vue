<script setup lang="ts">
export type ProTier = 'free' | 'pro' | 'growth' | 'scale'
export type ProBillingCycle = 'monthly' | 'annual'
export type ProUpgradeModalReason = 'sites_cap' | 'trial_paused' | 'read_only' | 'archived' | 'manual'

const {
  open,
  reason = 'manual',
  currentTier = null,
  suggestedTier = 'pro',
  currentSitesLimit,
} = defineProps<{
  open: boolean
  reason?: ProUpgradeModalReason
  currentTier?: ProTier | null
  /** Next tier the caller recommends; defaults to next-up from currentTier. */
  suggestedTier?: 'pro' | 'growth' | 'scale'
  /** Optional explicit current limit. Falls back to currentTier's limit. */
  currentSitesLimit?: number
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  'selectTier': [{ tier: ProTier, cycle: ProBillingCycle }]
}>()

interface TierData {
  id: ProTier
  name: string
  monthly: number
  annual: number
  sites: number
  sitesLabel: string
  blurb: string
  features: string[]
}

const tiers: TierData[] = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    annual: 0,
    sites: 1,
    sitesLabel: '1 site',
    blurb: '10 lookups/mo · MCP read-only',
    features: [
      'Search Console reports',
      '10 DataForSEO lookups / month',
      'MCP server (read-only)',
      'No AI chat',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 39,
    annual: 390,
    sites: 5,
    sitesLabel: '5 sites',
    blurb: 'All features, every site.',
    features: [
      'Up to 5 sites',
      'Generous DataForSEO fair-use included',
      'AI chat + content briefs',
      'MCP server (full)',
      'Indexing + Lighthouse + competitors',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    monthly: 99,
    annual: 990,
    sites: 10,
    sitesLabel: '10 sites',
    blurb: 'Full power for growing teams.',
    features: [
      'Up to 10 sites',
      'High-volume DataForSEO fair-use included',
      'AI chat + content briefs',
      'MCP server (full)',
      'REST API access',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    monthly: 299,
    annual: 2990,
    sites: 50,
    sitesLabel: '50 sites',
    blurb: '+ $5/site/mo over 50.',
    features: [
      '50 sites included',
      'Self-serve overage at $5/site/mo',
      'High-volume DataForSEO fair-use included',
      'AI chat + content briefs',
      'MCP server (full)',
      'REST API access',
    ],
  },
]

const tierById = (id: ProTier) => tiers.find(t => t.id === id)!

const step = ref<1 | 2>(1)
const cycle = ref<ProBillingCycle>('monthly')

watch(() => open, (isOpen) => {
  if (isOpen) {
    step.value = 1
    cycle.value = 'monthly'
  }
})

const isOpenModel = computed({
  get: () => open,
  set: v => emit('update:open', v),
})

function closeModal() {
  isOpenModel.value = false
}

const suggested = computed(() => tierById(suggestedTier))

const currentLimit = computed(() => {
  if (typeof currentSitesLimit === 'number')
    return currentSitesLimit
  if (!currentTier)
    return 1
  return tierById(currentTier).sites
})

const stepOneHeadline = computed(() => {
  if (reason === 'sites_cap')
    return `You're at your ${currentLimit.value}-site limit.`
  if (reason === 'trial_paused')
    return 'Your trial ended.'
  if (reason === 'read_only')
    return 'Your account is read-only.'
  if (reason === 'archived')
    return 'Your account is archived.'
  return 'Upgrade your plan.'
})

const stepOneDescription = computed(() => {
  const t = suggested.value
  if (reason === 'sites_cap')
    return `${t.name} tracks ${t.sitesLabel} for $${t.monthly}/mo or $${t.annual}/yr.`
  if (reason === 'trial_paused')
    return `Add a card to keep tracking. ${t.name} is $${t.monthly}/mo or $${t.annual}/yr.`
  if (reason === 'read_only')
    return `Reactivate to add sites and resume tracking. ${t.name} is $${t.monthly}/mo.`
  if (reason === 'archived')
    return 'Reactivate to restore your data and dashboards.'
  return `${t.name} is $${t.monthly}/mo or $${t.annual}/yr.`
})

const stepOneCta = computed(() => `Upgrade to ${suggested.value.name}`)

function selectTier(tier: ProTier) {
  emit('selectTier', { tier, cycle: cycle.value })
}

function annualSavings(t: TierData): number {
  return Math.max(0, t.monthly * 12 - t.annual)
}

function priceLabel(t: TierData): string {
  if (t.monthly === 0)
    return '$0'
  return cycle.value === 'monthly' ? `$${t.monthly}` : `$${t.annual}`
}

function priceUnit(t: TierData): string {
  if (t.monthly === 0)
    return 'forever'
  return cycle.value === 'monthly' ? '/month' : '/year'
}
</script>

<template>
  <UModal
    v-model:open="isOpenModel"
    :ui="{
      content: step === 1 ? 'max-w-md' : 'max-w-4xl',
    }"
  >
    <template #content>
      <div class="p-6 sm:p-8">
        <!-- Step 1: single CTA -->
        <div v-if="step === 1" class="space-y-5">
          <div class="flex items-start gap-3">
            <div class="size-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
              <UIcon name="i-lucide-sparkles" class="size-5 text-primary" aria-hidden="true" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-lg font-semibold text-highlighted">
                {{ stepOneHeadline }}
              </h2>
              <p class="text-sm text-muted mt-1">
                {{ stepOneDescription }}
              </p>
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-lucide-x"
              aria-label="Close"
              @click="closeModal"
            />
          </div>

          <div class="flex flex-col gap-2">
            <UButton
              size="lg"
              color="primary"
              block
              @click="selectTier(suggested.id)"
            >
              {{ stepOneCta }}
            </UButton>
            <button
              type="button"
              class="text-sm text-muted hover:text-default transition-colors underline underline-offset-4"
              @click="step = 2"
            >
              See other plans
            </button>
          </div>

          <p class="text-xs text-dimmed text-center">
            Cancel any time · 30-day free trial · No card required for trial
          </p>
        </div>

        <!-- Step 2: full grid with toggle -->
        <div v-else class="space-y-6">
          <div class="flex items-start gap-3">
            <button
              type="button"
              class="text-sm text-muted hover:text-default transition-colors flex items-center gap-1"
              @click="step = 1"
            >
              <UIcon name="i-lucide-arrow-left" class="size-4" aria-hidden="true" />
              Back
            </button>
            <h2 class="flex-1 text-lg font-semibold text-highlighted">
              Choose your plan
            </h2>
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              icon="i-lucide-x"
              aria-label="Close"
              @click="closeModal"
            />
          </div>

          <!-- Monthly / Annual toggle -->
          <div class="flex justify-center">
            <div class="inline-flex items-center rounded-full bg-muted p-1 border border-default">
              <button
                type="button"
                class="px-4 py-1.5 text-sm rounded-full transition-colors"
                :class="cycle === 'monthly' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
                @click="cycle = 'monthly'"
              >
                Monthly
              </button>
              <button
                type="button"
                class="px-4 py-1.5 text-sm rounded-full transition-colors flex items-center gap-2"
                :class="cycle === 'annual' ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-default'"
                @click="cycle = 'annual'"
              >
                Annual
                <span
                  class="text-[11px] font-medium px-1.5 py-0.5 rounded-md bg-success/10 text-success"
                >
                  save 2 months
                </span>
              </button>
            </div>
          </div>

          <!-- Tier grid -->
          <div class="grid sm:grid-cols-4 gap-4">
            <div
              v-for="t in tiers"
              :key="t.id"
              class="relative rounded-xl border p-5 flex flex-col"
              :class="[
                t.id === 'pro' ? 'border-primary/40 bg-primary/5' : 'border-default bg-elevated/50',
                currentTier === t.id ? 'ring-2 ring-primary/30' : '',
              ]"
            >
              <div v-if="t.id === 'pro'" class="absolute -top-3 left-5">
                <UBadge color="primary" variant="solid" size="sm">
                  Most popular
                </UBadge>
              </div>
              <div v-if="currentTier === t.id" class="absolute -top-3 right-5">
                <UBadge color="neutral" variant="subtle" size="sm">
                  Current plan
                </UBadge>
              </div>

              <h3 class="text-base font-semibold text-highlighted">
                {{ t.name }}
              </h3>
              <p class="text-xs text-muted mt-0.5">
                {{ t.sitesLabel }}
              </p>

              <div class="mt-4 flex items-baseline gap-1">
                <span class="text-3xl font-bold text-highlighted numerals-display">{{ priceLabel(t) }}</span>
                <span class="text-sm text-muted">{{ priceUnit(t) }}</span>
              </div>
              <p
                v-if="cycle === 'annual' && annualSavings(t) > 0"
                class="text-xs text-success mt-1"
              >
                save ${{ annualSavings(t) }}/yr vs monthly
              </p>
              <p v-else class="text-xs text-dimmed mt-1">
                {{ t.blurb }}
              </p>

              <ul class="mt-4 space-y-1.5 text-[13px] text-muted flex-1">
                <li
                  v-for="f in t.features"
                  :key="f"
                  class="flex items-start gap-1.5"
                >
                  <UIcon name="i-lucide-check" class="mt-0.5 size-3.5 text-success shrink-0" aria-hidden="true" />
                  <span>{{ f }}</span>
                </li>
              </ul>

              <div
                v-if="currentTier === t.id"
                class="mt-5 flex items-center justify-center rounded-md border border-default bg-muted px-3 py-1.5 text-sm text-muted"
                aria-disabled="true"
                role="status"
              >
                <UIcon name="i-lucide-check" class="size-3.5 mr-1.5 text-success" aria-hidden="true" />
                Current plan
              </div>
              <UButton
                v-else
                class="mt-5"
                size="sm"
                block
                :variant="t.id === 'pro' ? 'solid' : 'outline'"
                :color="t.id === 'pro' ? 'primary' : 'neutral'"
                @click="selectTier(t.id)"
              >
                <span v-if="t.id === 'free'">Stay on Free</span>
                <span v-else>Choose {{ t.name }}</span>
              </UButton>
            </div>
          </div>

          <p class="text-xs text-dimmed text-center">
            All features included on every plan · Cancel any time · + VAT for EU/UK
          </p>
        </div>
      </div>
    </template>
  </UModal>
</template>

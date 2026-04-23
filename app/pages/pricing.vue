<script setup lang="ts">
useSeoMeta({
  title: 'Pricing',
  description: 'Request Indexing is free and open source. Pro access unlocks long-term data retention, team seats, and priority support.',
})

const { loggedIn, user } = useUserSession()

const plans = [
  {
    title: 'Free',
    description: 'Everything you need to ship URLs to the Indexing API. No credit card, no trial.',
    price: '$0',
    billingPeriod: 'forever',
    features: [
      'Unlimited Google Search Console sites',
      'Up to 200 indexing requests per day (Google\'s quota)',
      'Real-time indexing status per URL',
      'Bulk submission via paste or sitemap',
      '16 months of Search Console history (matches Google\'s)',
      'All free tools: Index Checker, Bulk Checker, Site Report',
      'Self-host with the GPL-3.0 source',
    ],
  },
  {
    title: 'Pro',
    description: 'For teams and long-term projects that need history beyond Google\'s 16-month window.',
    price: '$—',
    billingPeriod: 'pricing finalised soon',
    badge: 'Early access',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited data retention (never lose history)',
      'Team seats with shared site access',
      'CSV + API export of historical data',
      'Indexing alerts via email and webhook',
      'Priority support from the maintainer',
      'Early access to new features',
    ],
  },
]

const faqItems = [
  {
    label: 'Why is the core product free?',
    icon: 'i-heroicons-heart',
    content: 'Request Indexing is open source under GPL-3.0. The Indexing API is free from Google, and the app is run by one maintainer. Pro exists to cover infrastructure costs and fund ongoing development — the free tier will always be complete.',
  },
  {
    label: 'What counts as Pro today?',
    icon: 'i-heroicons-sparkles',
    content: 'Pro is in early access while the billing model is being finalised. The feature list is what Pro will include at launch. If you want Pro access before public pricing lands, sign in and follow the "Upgrade" flow in your account — early adopters lock in launch pricing.',
  },
  {
    label: 'Can I self-host the whole thing?',
    icon: 'i-heroicons-server',
    content: 'Yes. The app is Nuxt running on Cloudflare Workers + D1 with a Google OAuth app you control. Clone the repo, set your own Google credentials, and you have the full product running on your own account. The GPL-3.0 license governs redistribution.',
  },
  {
    label: 'How do Google\'s quotas affect pricing?',
    icon: 'i-heroicons-gauge',
    content: 'Google\'s Indexing API caps you at 200 publish requests per day per project. Pro does not raise that cap — no one can, it is Google\'s limit. Pro adds room for scheduling, retries, and multi-project orchestration around that quota, not more quota itself.',
  },
  {
    label: 'When does Pro officially ship?',
    icon: 'i-heroicons-calendar',
    content: 'No fixed date yet. The billing integration, team invites, and retention migration are being built in the open on GitHub. Subscribe to the repo or follow @harlan_zw on Twitter for launch announcements.',
  },
  {
    label: 'How do I get Pro access early?',
    icon: 'i-heroicons-ticket',
    content: 'Sign in with your Google account, then use the Upgrade link in your account menu. Early access users get a founders discount at launch.',
  },
]

const comparisonRows = [
  { feature: 'Google Search Console sites', free: 'Unlimited', pro: 'Unlimited' },
  { feature: 'Indexing API requests / day', free: '200 (Google cap)', pro: '200 (Google cap)' },
  { feature: 'Search Console data retention', free: '16 months', pro: 'Forever' },
  { feature: 'Bulk URL submission', free: true, pro: true },
  { feature: 'CSV export', free: true, pro: true },
  { feature: 'Historical data API', free: false, pro: true },
  { feature: 'Team seats', free: false, pro: true },
  { feature: 'Email + webhook alerts', free: false, pro: true },
  { feature: 'Priority support', free: false, pro: true },
  { feature: 'Self-host (GPL-3.0)', free: true, pro: true },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <div class="bg-verdant divider-tilt">
      <UContainer>
        <section class="py-16 sm:py-20 text-center">
          <UBadge color="primary" variant="subtle" class="mb-5">
            Pricing
          </UBadge>
          <h1 class="font-title font-bold leading-[1.05] tracking-[-0.03em] text-default text-4xl sm:text-5xl lg:text-6xl mb-5 max-w-3xl mx-auto">
            Free forever.
            <span class="whitespace-nowrap">Pro when you're <span class="underline decoration-primary/50 underline-offset-4">serious</span>.</span>
          </h1>
          <p class="text-toned max-w-2xl mx-auto text-lg mb-6">
            The full product is free and open source. Pro exists for teams and long-running projects that need history beyond Google's 16-month window.
          </p>
          <div class="inline-flex items-center gap-2 text-sm text-muted">
            <UIcon name="i-heroicons-shield-check" class="size-4 text-primary" />
            <span>No credit card required for Free</span>
          </div>
        </section>
      </UContainer>
    </div>

    <!-- Plans -->
    <div class="bg-default py-16 sm:py-20">
      <UContainer :ui="{ container: 'max-w-5xl' }">
        <UPricingPlans :compact="false">
          <UPricingPlan
            v-for="plan in plans"
            :key="plan.title"
            :title="plan.title"
            :description="plan.description"
            :price="plan.price"
            :billing-period="plan.billingPeriod"
            :features="plan.features"
            :badge="plan.badge"
            :highlight="plan.highlight"
          >
            <template #button>
              <template v-if="plan.title === 'Free'">
                <UButton
                  v-if="!loggedIn"
                  to="/get-started"
                  external
                  size="lg"
                  color="neutral"
                  variant="outline"
                  block
                  trailing-icon="i-heroicons-arrow-right"
                >
                  Get started free
                </UButton>
                <UButton
                  v-else
                  to="/dashboard"
                  size="lg"
                  color="neutral"
                  variant="outline"
                  block
                  trailing-icon="i-heroicons-arrow-right"
                >
                  Open dashboard
                </UButton>
              </template>
              <template v-else>
                <UButton
                  v-if="loggedIn && user.access !== 'pro'"
                  to="/account/upgrade"
                  size="lg"
                  color="primary"
                  block
                  trailing-icon="i-heroicons-sparkles"
                >
                  Request early access
                </UButton>
                <UButton
                  v-else-if="user?.access === 'pro'"
                  size="lg"
                  color="primary"
                  variant="soft"
                  block
                  disabled
                  icon="i-heroicons-check-circle"
                >
                  You're on Pro
                </UButton>
                <UButton
                  v-else
                  to="/get-started"
                  external
                  size="lg"
                  color="primary"
                  block
                  trailing-icon="i-heroicons-arrow-right"
                >
                  Sign up for early access
                </UButton>
              </template>
            </template>
          </UPricingPlan>
        </UPricingPlans>

        <p class="text-center text-xs text-muted mt-8 max-w-xl mx-auto">
          Pro billing is in development. Early access users lock in founders pricing at launch. Everything in Free stays free, forever.
        </p>
      </UContainer>
    </div>

    <!-- Comparison Table -->
    <UPageSection
      headline="Side by side"
      title="What's in each plan"
      :ui="{ container: 'max-w-4xl', title: 'font-title' }"
    >
      <div class="rounded-xl border border-default bg-elevated overflow-hidden">
        <div class="grid grid-cols-[1fr_auto_auto] text-sm">
          <div class="px-5 py-4 bg-muted/60 border-b border-default text-xs text-muted font-semibold uppercase tracking-[0.15em]">
            Feature
          </div>
          <div class="px-5 py-4 bg-muted/60 border-b border-default text-center text-default font-semibold min-w-[96px]">
            Free
          </div>
          <div class="px-5 py-4 bg-muted/60 border-b border-default text-center text-primary font-semibold min-w-[96px]">
            Pro
          </div>

          <template v-for="(row, i) in comparisonRows" :key="row.feature">
            <div class="px-5 py-3.5 text-default" :class="[i < comparisonRows.length - 1 ? 'border-b border-default' : '']">
              {{ row.feature }}
            </div>
            <div class="px-5 py-3.5 text-center" :class="[i < comparisonRows.length - 1 ? 'border-b border-default' : '']">
              <span v-if="typeof row.free === 'string'" class="text-muted text-xs">{{ row.free }}</span>
              <UIcon v-else-if="row.free" name="i-heroicons-check" class="size-4 text-primary inline-block" />
              <UIcon v-else name="i-heroicons-minus" class="size-4 text-muted/50 inline-block" />
            </div>
            <div class="px-5 py-3.5 text-center" :class="[i < comparisonRows.length - 1 ? 'border-b border-default' : '']">
              <span v-if="typeof row.pro === 'string'" class="text-muted text-xs">{{ row.pro }}</span>
              <UIcon v-else-if="row.pro" name="i-heroicons-check" class="size-4 text-primary inline-block" />
              <UIcon v-else name="i-heroicons-minus" class="size-4 text-muted/50 inline-block" />
            </div>
          </template>
        </div>
      </div>
    </UPageSection>

    <!-- Self-host callout -->
    <UPageSection
      :ui="{ container: 'max-w-4xl' }"
    >
      <div class="rounded-xl border border-default bg-elevated p-8 sm:p-10 grid sm:grid-cols-[auto_1fr_auto] items-center gap-6">
        <div class="size-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <UIcon name="i-simple-icons-github" class="size-7 text-primary" />
        </div>
        <div>
          <h3 class="font-title text-xl font-semibold text-default mb-1">
            Want to run it yourself?
          </h3>
          <p class="text-toned text-sm">
            The whole app is open source under GPL-3.0. Clone it, point it at your own Google credentials, and you own the stack end to end.
          </p>
        </div>
        <UButton
          to="https://github.com/harlan-zw/request-indexing"
          target="_blank"
          color="neutral"
          variant="outline"
          icon="i-simple-icons-github"
          class="w-full sm:w-auto justify-center"
        >
          View source
        </UButton>
      </div>
    </UPageSection>

    <!-- FAQ -->
    <UPageSection
      title="Pricing questions"
      :ui="{ container: 'max-w-3xl', title: 'font-title' }"
    >
      <UAccordion :items="faqItems" multiple />
    </UPageSection>

    <!-- CTA -->
    <UPageSection :ui="{ container: 'max-w-4xl' }">
      <UPageCTA
        title="Start free, upgrade when you need to"
        description="You can run the whole product on the free tier, forever. Pro is for when 16 months of history stops being enough."
        variant="subtle"
        :links="[
          { label: 'Get Started Free', to: '/get-started', color: 'primary', size: 'xl', trailingIcon: 'i-heroicons-arrow-right' },
          { label: 'View on GitHub', to: 'https://github.com/harlan-zw/request-indexing', target: '_blank', variant: 'ghost', color: 'neutral', size: 'xl', icon: 'i-simple-icons-github' },
        ]"
      />
    </UPageSection>
  </div>
</template>

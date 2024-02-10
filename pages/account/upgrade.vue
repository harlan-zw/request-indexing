<script setup lang="ts">
definePageMeta({
  layout: 'account',
})
</script>

<template>
  <div>
    <UPageHeader title="Upgrade To Pro" icon="i-heroicons-star" description="Unlock more API credits and new features by upgrading to pro." headline="Your Account" />
    <UPageBody>
      <p class="mb-12">
        Hey! Thanks for your interest in the pro version. Due to the limitations on Google's Web Indexing API I'm only able to offer accepting a limited number of people for the pro plan.
      </p>
      <div>
        <div class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl text-center">
          Pro Features
        </div>
        <div class="grid grid-cols-2 gap-5 mt-10">
          <ULandingCard icon="i-heroicons-sparkles" color="purple" title="Index Everything" description="Quota of 200 Request Indexing credits per day. Use sites with more than 1000 pages." />
          <ULandingCard icon="i-heroicons-sparkles" color="purple" title="Own Your Google Search Data" description="GSC only stores your data for 16 months, store it permanently instead." />
        </div>
        <div class="grid grid-cols-2 gap-5 mt-10">

          <ULandingCard class="relative" icon="i-heroicons-bug-ant" color="purple" title="Automatic Indexing" description="Set and forget, always have your latest links indexed straight away.">
            <UBadge class="absolute top-5 right-5" color="blue" variant="soft">
              Coming Soon
            </UBadge>
          </ULandingCard>
          <ULandingCard class="relative" icon="i-heroicons-bolt" color="purple" title="AI Backlink Finder" description="Backlinks are improving your web presence, automatically find opportunities.">
            <UBadge class="absolute top-5 right-5" color="blue" variant="soft">
              Coming Soon
            </UBadge>
          </ULandingCard>
        </div>
        <div class="text-gray-500 text-center mt-3">
          Including a SEO consultation to help you get started with Request Indexing.
        </div>
      </div>
      <div class="mt-10">
        <UPricingCard class="mt-10" title="Pro Plan" price="$30 USD" cycle="month" :button="{ to: 'https://buy.stripe.com/5kAdUR2rE8VHcYE7ss', label: 'Purchase Pro Plan', color: 'purple', variant: 'solid' }" description="Unlock more API credits and new features by upgrading to pro.">
          <template #footer>
            <div class="text-2xl">
              Only 4 Plans Total
            </div>
          </template>
        </UPricingCard>
        <div class="text-gray-500 text-center mt-3">
          After purchase your new quota needs to be set up manually. I'll be in touch within 12 hours.
        </div>
      </div>
    </UPageBody>
  </div>
</template>

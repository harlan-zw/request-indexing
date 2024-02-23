<script setup lang="ts">
definePageMeta({
  layout: 'account',
})

const user = useAuthenticatedUser()
</script>

<template>
  <div>
    <UPageHeader title="Upgrade To Pro" icon="i-heroicons-star" description="Take your account to the next level with Request Indexing Pro." headline="Your Account" />
    <UPageBody>
      <ULandingSection :ui="{ wrapper: ['py-12 sm:py-16'], container: ['px-0 lg:px-0 sm:px-0'] }" title="Features" description="More API credits, less manual work with Request Indexing Pro.">
        <div class="grid grid-cols-3 gap-5 mt-10">
          <ULandingCard icon="i-heroicons-sparkles" color="purple" title="200 API Quota" description="Quota of 200 Request Indexing credits per day. Use sites with more than 1000 pages." />
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
      </ULandingSection>
      <div v-if="user.access !== 'pro'" class="mt-10">
        <UPricingCard class="mt-10" title="Pro Plan" price="$30 USD" cycle="month" :button="{ to: `https://buy.stripe.com/bIY3gd9U62xjbUA001?client_reference_id=${user.userId}`, label: 'Purchase Pro Plan', color: 'purple', variant: 'solid' }" description="Unlock more API credits and new features by upgrading to pro.">
          <template #footer>
            <UBadge variant="soft" color="orange">
              3 left
            </UBadge>
            <div class="text-gray-500 dark:text-gray-400 text-sm mt-1 mx-2 max-w-sm">
              Due to the restrictions on Google's Web Indexing API there is limited availability for the Pro Plan.
            </div>
          </template>
        </UPricingCard>
      </div>
      <div>
        You are currently a pro user.
      </div>
    </UPageBody>
  </div>
</template>

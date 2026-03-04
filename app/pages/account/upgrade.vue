<script setup lang="ts">
definePageMeta({
  layout: 'user-dashboard',
  title: 'Request Indexing Pro',
  icon: 'i-heroicons-star',
})

const user = useAuthenticatedUser()
</script>

<template>
  <div>
    <div v-if="user.access === 'pro'">
      <UButton to="https://billing.stripe.com/p/login/00g16Gas1gID8jCcMM">
        Manage my subscription
      </UButton>
    </div>
    <template v-else>
      <ul>
        <li>Track up to 60 sites with backups of GSC data.</li>
        <li>Double your daily request indexing API limit to 30.</li>
        <li>Access new features</li>
      </ul>
      <ULandingSection :ui="{ wrapper: ['py-12 sm:py-16'], container: ['px-0 lg:px-0 sm:px-0'] }" title="Pro Only Features" description="More API credits, less manual work with Request Indexing Pro.">
        <div class="grid grid-cols-3 gap-5 mt-10">
          <ULandingCard class="relative" icon="i-heroicons-bug-ant" color="purple" title="Automatic Indexing" description="Set and forget, always have your latest links indexed straight away.">
            <UBadge class="absolute top-5 right-5" color="blue" variant="soft">
              Coming Soon
            </UBadge>
          </ULandingCard>
          <ULandingCard class="relative" icon="i-heroicons-bolt" color="purple" title="Daily Backlink Report" description="See the sites that are linking to your domains and see if they're trusted.">
            <UBadge class="absolute top-5 right-5" color="blue" variant="soft">
              Coming Soon
            </UBadge>
          </ULandingCard>
          <ULandingCard class="relative" icon="i-heroicons-bolt" color="purple" title="Keyword Research" description="See the sites that are linking to your domains and see if they're trusted.">
            <UBadge class="absolute top-5 right-5" color="blue" variant="soft">
              Coming Soon
            </UBadge>
          </ULandingCard>
        </div>
      </ULandingSection>
      <div class="mt-10">
        <UPricingCard class="mt-10" title="Pro Plan" price="$12" cycle="month" :button="{ to: `https://buy.stripe.com/bIY3gd9U62xjbUA001?client_reference_id=${user.userId}`, label: 'Purchase Pro Plan', color: 'purple', variant: 'solid' }" description="Unlock more API credits and new features by upgrading to pro.">
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
    </template>
  </div>
</template>

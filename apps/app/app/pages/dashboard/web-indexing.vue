<script lang="ts" setup>
import { fetchSites } from '~~/layers/core/app/composables/fetch'

definePageMeta({
  layout: 'dashboard',
  title: 'Web Indexing',
  icon: 'i-ph-list-checks-duotone',
  description: 'See how your sites organic Google traffic is performing.',
})

const { data } = await fetchSites()
const sites = computed(() => (data.value?.sites || []))
</script>

<template>
  <div class="space-y-10">
    <div v-for="site in sites" :key="site.siteId">
      <CardTitle>
        <!-- `site.siteId` is the route slug. The sync engine id (`gscdumpSiteId`)
             is not a valid slug and 404s if used here. -->
        <NuxtLink
          :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/web-indexing`"
          class="flex min-h-11 items-center gap-2 rounded-md text-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <SiteFavicon :site="site" />
          <h2 class="font-bold">
            {{ siteLabel(site) }}
          </h2>
          <UIcon name="i-heroicons-arrow-right" class="size-4 text-muted" aria-hidden="true" />
        </NuxtLink>
      </CardTitle>
      <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
        <GscdumpIndexingSummary v-if="site.gscdumpSiteId" :site-id="site.gscdumpSiteId" />
        <div v-else class="flex flex-col items-start gap-3 py-4">
          <div>
            <p class="font-medium text-highlighted">
              Indexing data is not available yet
            </p>
            <p class="text-sm text-muted">
              This site is not synced with Search Console. Resync your sites to start collecting indexing data.
            </p>
          </div>
          <UButton to="/dashboard/team/sites" color="neutral" variant="outline" size="sm" class="min-h-11" label="Resync sites" />
        </div>
      </UCard>
    </div>
  </div>
</template>

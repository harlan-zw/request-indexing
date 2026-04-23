<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'

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
        <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/web-indexing`" class="text-sm flex items-center gap-1">
          <SiteFavicon :site="site" />
          <h2 class="font-bold">
            {{ site.domain }}
          </h2>
        </NuxtLink>
      </CardTitle>
      <UCard v-if="site.gscdumpSiteId" :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
        <GscdumpIndexingSummary :site-id="site.gscdumpSiteId" />
      </UCard>
      <div v-else class="text-sm text-gray-500 py-4">
        No gscdump site linked.
      </div>
    </div>
  </div>
</template>

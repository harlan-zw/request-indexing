<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'

definePageMeta({
  layout: 'dashboard',
  title: 'Web Indexing',
  icon: 'i-heroicons-checkmark-circle',
  description: 'See how your sites organic Google traffic is performing.',
})

// const { user } = useUserSession()

const { data } = await fetchSites()
const sites = computed(() => {
  return (data.value?.sites || [])
})

const selectedCharts = ref([
  'clicks',
  'impressions',
])

function toggleChart(chart: string) {
  if (selectedCharts.value.includes(chart))
    selectedCharts.value = selectedCharts.value.filter(c => c !== chart)
  else
    selectedCharts.value.push(chart)
}
</script>

<template>
  <div class="flex flex-wrap gap-5">
    <div v-for="(site) in sites" :key="site.siteId">
      <CardWebIndexing :site="site" :selected-charts="selectedCharts" @toggle-chart="toggleChart" />
    </div>
    <UCard :ui="{ body: { base: ['w-full h-full min-h-[275px]'] } }">
      <div class="flex text-center items-center flex-col justify-center h-full">
        <UButton to="https://search.google.com/search-console" variant="link" target="_blank" size="xl" icon="i-heroicons-plus" color="gray" class="mb-2">
          <span>Add New Site</span>
        </UButton>
        <p class="text-gray-500 text-xs">
          You will need to create a new Property in Google Search Console and then refresh.
        </p>
      </div>
    </UCard>
  </div>
</template>

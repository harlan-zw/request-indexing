<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'
import { useJobListener } from '~/composables/events'

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
  description: 'See how your sites organic Google traffic is performing.',
  icon: 'i-ph-app-window-duotone',
})

const { data, refresh } = await fetchSites()
const sites = computed(() => (data.value?.sites || []))

useJobListener('sites/syncFinished', refresh)

const selectedCharts = ref([
  'clicks',
  'impressions',
])

// function toggleChart(chart: string) {
//   if (selectedCharts.value.includes(chart))
//     selectedCharts.value = selectedCharts.value.filter(c => c !== chart)
//   else
//     selectedCharts.value.push(chart)
// }
</script>

<template>
  <div class="flex flex-wrap items-center gap-5">
    <CardSite v-for="(site) in sites" :key="site.siteId" :site="site" :selected-charts="selectedCharts" />
  </div>
</template>

<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'

// const { user } = useUserSession()

definePageMeta({
  layout: 'dashboard',
  title: 'PageSpeed Insights',
  description: 'See how your sites organic Google traffic is performing.',
  icon: 'i-heroicons-window',
})

const { data } = await fetchSites()
const sites = computed(() => {
  return (data.value?.sites || [])
})

const selectedCharts = ref([
  'performance',
  'seo',
  'accessibility',
  'bestPractices',
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
    <CardPageSpeedInsights v-for="(site) in sites" :key="site.siteId" :site="site" :selected-charts="selectedCharts" @toggle-chart="toggleChart" />
  </div>
</template>

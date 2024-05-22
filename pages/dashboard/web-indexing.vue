<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'

definePageMeta({
  layout: 'dashboard',
  title: 'Web Indexing',
  icon: 'i-ph-list-checks-duotone',
  description: 'See how your sites organic Google traffic is performing.',
})

// const { user } = useUserSession()

const { data } = await fetchSites()
const sites = computed(() => {
  return (data.value?.sites || [])
})

const selectedCharts = ref(['totalPagesCount', 'indexedPagesCount'])

function toggleChart(chart: string) {
  if (selectedCharts.value.includes(chart))
    selectedCharts.value = selectedCharts.value.filter(c => c !== chart)
  else
    selectedCharts.value.push(chart)
}
</script>

<template>
  <div class="flex flex-wrap gap-5">
    <CardWebIndexing v-for="(site) in sites" :key="site.siteId" :site="site" :selected-charts="selectedCharts" @toggle-chart="toggleChart" />
  </div>
</template>

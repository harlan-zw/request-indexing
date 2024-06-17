<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'
import { useJobListener } from '~/composables/events'

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
  icon: 'i-ph-app-window-duotone',
})

const { data, refresh } = await fetchSites()
const key = ref(0)
const sites = computed(() => (data.value?.sites || []))

const stats = ref()

onMounted(async () => {
  stats.value = await $fetch('/api/sites/stats')
})

useJobListener('sites/syncFinished', async () => {
  await refresh()
  key.value++
})

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
const previousPeriodClicksPercent = computed(() => {
  if (!stats.value?.prevPeriod?.clicks || !stats.value?.period?.clicks)
    return 0
  return ((stats.value.period.clicks - stats.value.prevPeriod.clicks) / stats.value.prevPeriod.clicks) * 100
})

const previousPeriodImpressionsPercent = computed(() => {
  if (!stats.value?.prevPeriod?.impressions || !stats.value?.period?.impressions)
    return 0
  return ((stats.value.period.impressions - stats.value.prevPeriod.impressions) / stats.value.prevPeriod.impressions) * 100
})

const allSitesLoaded = computed(() => {
  return sites.value.filter(s => s.isSynced).length === sites.value.length
})
</script>

<template>
  <div :key="key">
    <div v-if="allSitesLoaded" class="max-w-2xl mb-12">
      <div class="flex items-center justify-between gap-3 text-gray-600">
        <div>
          <UIcon class="w-4 h-4 flex-grow" name="i-ph-arrow-circle-left-duotone" />
        </div>
        <div class="flex-shrink">
          In the last <span class="underline font-semibold">30 days</span>, your sites have received <span class="font-semibold">{{ useHumanFriendlyNumber(stats?.period.clicks || 0) }} clicks</span> and <strong>{{ useHumanFriendlyNumber(stats?.period.impressions || 0) }} impressions</strong>. Compared
          to the <span class="underline font-semibold">previous period</span>, this is a <strong>{{ useHumanFriendlyNumber(previousPeriodClicksPercent) }}% {{ previousPeriodClicksPercent > 0 ? 'increase' : 'decrease' }}</strong> in clicks and a <strong>{{ useHumanFriendlyNumber(previousPeriodImpressionsPercent) }}% {{ previousPeriodImpressionsPercent > 0 ? 'increase' : 'decrease' }}</strong> in impressions.
        </div>
        <div>
          <UIcon class="w-4 h-4" name="i-ph-arrow-circle-right-duotone" />
        </div>
      </div>
    </div>
    <div v-else>
      <UAlert title="Setting up your dashboard" color="blue" variant="subtle" description="This could take some time." class="mb-10 max-w-lg" />
    </div>
    <div class="flex flex-wrap items-center gap-7">
      <CardSite v-for="(site) in sites" :key="site.siteId" :site="site" :selected-charts="selectedCharts" />
    </div>
  </div>
</template>

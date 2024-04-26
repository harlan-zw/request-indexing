<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'

definePageMeta({
  layout: 'dashboard',
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

// const isSyncLoading = ref(false)
// function sync() {
//   callFnSyncToggleRef(forceRefresh, isSyncLoading)
// }

// const allSitesTotal = ref()
// onMounted(() => {
//   let clicks = 0
//   let impressions = 0
//   let prevClicks = 0
//   let prevImpressions = 0
//   const promises = []
//   for (const _site of sites?.value || []) {
//     const siteData = useSiteData(_site)
//     const analytics = siteData.analytics()
//     promises.push(analytics.then((res) => {
//       if (res.data.value) {
//         clicks += res.data.value.period.clicks
//         impressions += res.data.value.period.impressions
//         prevClicks += res.data.value.prevPeriod?.clicks || 0
//         prevImpressions += res.data.value.prevPeriod?.impressions || 0
//       }
//     }))
//   }
//   Promise.allSettled(promises).then(() => {
//     allSitesTotal.value = {
//       period: {
//         clicks,
//         impressions,
//       },
//       prevPeriod: {
//         clicks: prevClicks,
//         impressions: prevImpressions,
//       },
//     }
//   })
// })
</script>

<template>
  <UPage class="mx-auto max-w-[1400px]">
    <div>
      <DashboardPageTitle
        icon="i-heroicons-rocket-launch"
        title="PageSpeed Insights"
        description="See how your sites organic Google traffic is performing."
      />
      <div class="flex flex-wrap gap-5">
        <div v-for="(site) in sites" :key="site.siteId">
          <CardGoogleSearchConsole :site="site" :selected-charts="selectedCharts" @toggle-chart="toggleChart" />
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
    </div>
  </UPage>
</template>

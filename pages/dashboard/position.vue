<script lang="ts" setup>
import { fetchSites, useSiteData } from '~/composables/fetch'

const { user } = useUserSession()

const { data } = await fetchSites()

// const isSyncLoading = ref(false)
// function sync() {
//   callFnSyncToggleRef(forceRefresh, isSyncLoading)
// }

const sites = computed(() => {
  return (data.value?.sites || [])
})

const allSitesTotal = ref()
onMounted(() => {
  const periods = []
  const prevPeriods = []
  const promises = []
  for (const _site of sites.value!) {
    const siteData = useSiteData(_site)
    const analytics = siteData.analytics()
    promises.push(analytics.then((res) => {
      if (res.data.value) {
        periods.push(res.data.value.period)
        if (res.data.value.prevPeriod)
          prevPeriods.push(res.data.value.prevPeriod)
      }
    }))
  }
  Promise.allSettled(promises).then(() => {
    allSitesTotal.value = {
      period: {
        position: periods.reduce((acc, curr) => acc + curr.position, 0) / periods.length,
        ctr: (periods.reduce((acc, curr) => acc + curr.ctr, 0) / periods.length) * 100,
      },
      prevPeriod: {
        position: prevPeriods.reduce((acc, curr) => acc + curr.position, 0) / prevPeriods.length,
        ctr: (prevPeriods.reduce((acc, curr) => acc + curr.ctr, 0) / prevPeriods.length) * 100,
      },
    }
  })
})
</script>

<template>
  <UContainer>
    <div class="py-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:gap-10">
          <div class="mb-3 md:mb-0">
            <h2 class="text-2xl font-bold mb-1 flex items-center gap-2">
              <UIcon name="i-heroicons-chart-bar" />
              <span>Position & CTR</span>
              <UBadge color="gray" variant="soft">
                {{ sites.length }}
              </UBadge>
            </h2>
            <p class="text-gray-400 text-sm">
              You can change which sites are shown here on your <NuxtLink to="/account" class="underline">
                account page
              </NuxtLink>.
            </p>
          </div>
          <div v-if="allSitesTotal" class="mb-3 md:mb-0 flex items-center md:justify-center gap-2 md:gap-5">
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-1">
                <span class="text-sm opacity-70">Position</span>
              </div>
              <PositionMetric :value="allSitesTotal.period.position" />
              <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" negative :value="allSitesTotal.period.position" :prev-value="allSitesTotal.prevPeriod.position" />
            </div>
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-1">
                <span class="text-sm opacity-70">CTR</span>
              </div>
              <div class="text-xl flex items-end gap-2">
                <span>{{ useHumanFriendlyNumber(allSitesTotal.period.ctr) }}%</span>
                <IconCtr />
              </div>
              <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="allSitesTotal.period.ctr" :prev-value="allSitesTotal.prevPeriod.ctr" />
            </div>
          </div>
        </div>
      </div>
      <div class="grid 2xl:grid-cols-3 lg:grid-cols-2 gap-7">
        <div v-for="(site) in sites" :key="site.siteId">
          <CardSiteKeywords :site="site" class="max-w-full" />
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
  </UContainer>
</template>

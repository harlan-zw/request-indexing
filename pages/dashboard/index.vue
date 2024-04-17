<script lang="ts" setup>
import { fetchSites, useSiteData } from '~/composables/fetch'

const { user } = useUserSession()

const { data } = await fetchSites()
const sites = computed(() => {
  return (data.value?.sites || [])
})

// const isSyncLoading = ref(false)
// function sync() {
//   callFnSyncToggleRef(forceRefresh, isSyncLoading)
// }

const allSitesTotal = ref()
onMounted(() => {
  let clicks = 0
  let impressions = 0
  let prevClicks = 0
  let prevImpressions = 0
  const promises = []
  for (const _site of sites.value!) {
    const siteData = useSiteData(_site)
    const analytics = siteData.analytics()
    promises.push(analytics.then((res) => {
      if (res.data.value) {
        clicks += res.data.value.period.clicks
        impressions += res.data.value.period.impressions
        prevClicks += res.data.value.prevPeriod?.clicks || 0
        prevImpressions += res.data.value.prevPeriod?.impressions || 0
      }
    }))
  }
  Promise.allSettled(promises).then(() => {
    allSitesTotal.value = {
      period: {
        clicks,
        impressions,
      },
      prevPeriod: {
        clicks: prevClicks,
        impressions: prevImpressions,
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
              <UIcon name="i-heroicons-cursor-arrow-rays" />
              <span>Clicks & Impressions</span>
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
                <span class="text-sm opacity-70">Clicks</span>
              </div>
              <div class="text-xl flex items-end gap-2">
                <span>{{ useHumanFriendlyNumber(allSitesTotal.period.clicks) }}</span>
                <IconClicks />
              </div>
              <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="allSitesTotal.period.clicks" :prev-value="allSitesTotal.prevPeriod.clicks" />
            </div>
            <div class="flex flex-col justify-center">
              <div class="flex items-center gap-1">
                <span class="text-sm opacity-70">Impressions</span>
              </div>
              <div class="text-xl flex items-end gap-2">
                <span>{{ useHumanFriendlyNumber(allSitesTotal.period.impressions) }}</span>
                <IconImpressions />
              </div>
              <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="allSitesTotal.period.impressions" :prev-value="allSitesTotal.prevPeriod.impressions" />
            </div>
          </div>
        </div>
      </div>
      <div class="grid 2xl:grid-cols-3 lg:grid-cols-2 gap-7">
        <div v-for="(site) in sites" :key="site.siteId">
          <CardSiteClicks :site="site" class="max-w-full" />
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

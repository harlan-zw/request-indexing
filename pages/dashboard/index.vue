<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'

const { user } = useUserSession()

const { data: sites, forceRefresh } = await fetchSites()

const isSyncLoading = ref(false)
function sync() {
  callFnSyncToggleRef(forceRefresh, isSyncLoading)
}

const hiddenSites = computed(() => user.value.hiddenSites || [])

const visibleSites = computed(() => {
  return (sites.value || []).filter(site => !hiddenSites.value.includes(site.siteUrl))
})

const allSitesTotal = ref(null)
onMounted(async () => {
  let clicks = 0
  let impressions = 0
  let prevClicks = 0
  let prevImpressions = 0
  for (const _site of visibleSites.value!) {
    const { data: site } = await fetchSite(_site)
    if (site.value) {
      clicks += site.value.analytics.period.totalClicks
      impressions += site.value.analytics.period.totalImpressions
      prevClicks += site.value.analytics.prevPeriod.totalClicks
      prevImpressions += site.value.analytics.prevPeriod.totalImpressions
    }
  }
  allSitesTotal.value = {
    period: {
      totalClicks: clicks,
      totalImpressions: impressions,
    },
    prevPeriod: {
      totalClicks: prevClicks,
      totalImpressions: prevImpressions,
    },
  }
})
</script>

<template>
  <UContainer>
    <div class="py-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:gap-10">
          <div class="mb-3 md:mb-0">
            <h2 class="text-2xl font-bold mb-1 flex items-center gap-2">
              <span>Your Sites</span>
              <UBadge color="gray" variant="soft">
                {{ visibleSites.length }}
              </UBadge>
            </h2>
            <p class="text-gray-400 text-sm">
              Data from <NuxtLink to="https://search.google.com/search-console" target="_blank" class="underline">
                Google Search Console
              </NuxtLink>
            </p>
          </div>
          <div v-if="allSitesTotal" class="mb-3 md:mb-0 flex items-center md:justify-center gap-2 md:gap-5">
            <div class="flex flex-col justify-center">
              <span class="text-sm opacity-70">Clicks</span>
              <div class="text-xl flex items-end gap-2">
                <span>{{ useHumanFriendlyNumber(allSitesTotal.period.totalClicks) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="w-5 h-5 opacity-80"><path fill="#888888" d="m11.5 11l6.38 5.37l-.88.18l-.64.12c-.63.13-.99.83-.71 1.4l.27.58l1.36 2.94l-1.42.66l-1.36-2.93l-.26-.58a.985.985 0 0 0-1.52-.36l-.51.4l-.71.57zm-.74-2.31a.76.76 0 0 0-.76.76V20.9c0 .42.34.76.76.76c.19 0 .35-.06.48-.16l1.91-1.55l1.66 3.62c.13.27.4.43.69.43c.11 0 .22 0 .33-.08l2.76-1.28c.38-.18.56-.64.36-1.01L17.28 18l2.41-.45a.88.88 0 0 0 .43-.26c.27-.32.23-.79-.12-1.08l-8.74-7.35l-.01.01a.756.756 0 0 0-.49-.18M15 10V8h5v2zm-1.17-5.24l2.83-2.83l1.41 1.41l-2.83 2.83zM10 0h2v5h-2zM3.93 14.66l2.83-2.83l1.41 1.41l-2.83 2.83zm0-11.32l1.41-1.41l2.83 2.83l-1.41 1.41zM7 10H2V8h5z" /></svg>
              </div>
              <TrendPercentage :value="allSitesTotal.period.totalClicks" :prev-value="allSitesTotal.prevPeriod.totalClicks" />
            </div>
            <div class="flex flex-col justify-center">
              <span class="text-sm opacity-70">Impressions</span>
              <div class="text-xl flex items-end gap-2">
                <span>{{ useHumanFriendlyNumber(allSitesTotal.period.totalImpressions) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="0" height="24" viewBox="0 0 32 32" class="w-5 h-5 opacity-80"><path fill="#888888" d="M30.94 15.66A16.69 16.69 0 0 0 16 5A16.69 16.69 0 0 0 1.06 15.66a1 1 0 0 0 0 .68A16.69 16.69 0 0 0 16 27a16.69 16.69 0 0 0 14.94-10.66a1 1 0 0 0 0-.68ZM16 25c-5.3 0-10.9-3.93-12.93-9C5.1 10.93 10.7 7 16 7s10.9 3.93 12.93 9C26.9 21.07 21.3 25 16 25Z" /><path fill="#888888" d="M16 10a6 6 0 1 0 6 6a6 6 0 0 0-6-6Zm0 10a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" /></svg>
              </div>
              <TrendPercentage :value="allSitesTotal.period.totalImpressions" :prev-value="allSitesTotal.prevPeriod.totalImpressions" />
            </div>
          </div>
        </div>
        <UButton class="hidden md:flex" variant="ghost" color="gray" icon="i-heroicons-arrow-path" :loading="isSyncLoading" @click="sync">
          Refresh
        </UButton>
      </div>
      <div class="grid 2xl:grid-cols-3 lg:grid-cols-2 gap-5">
        <div v-for="(site) in visibleSites" :key="site.siteUrl">
          <SiteCard :site="site" class="max-w-full" />
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

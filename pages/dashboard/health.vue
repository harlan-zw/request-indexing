<script lang="ts" setup>
import { withHttps } from 'ufo'
import { fetchSites } from '~/composables/fetch'
import { exponentialMovingAverage } from '~/lib/time-smoothing/exponentialMovingAverage'
import { simpleMovingAverage } from '~/lib/time-smoothing/simpleMovingAverage'
import { useFriendlySiteUrl, useTimeMonthsAgo } from '~/composables/formatting'

const { user, session } = useUserSession()

const { data } = await fetchSites()

// const isSyncLoading = ref(false)
// function sync() {
//   callFnSyncToggleRef(forceRefresh, isSyncLoading)
// }

const sites = computed(() => {
  return (data.value?.sites || [])
})

const allSitesTotal = ref(null)
const expandedSitesData = ref([])

watch(sites, async () => {
  let clicks = 0
  let impressions = 0
  let prevClicks = 0
  let prevImpressions = 0
  const expandedSites = []
  for (const _site of sites.value!) {
    const { data: site } = await fetchSite(_site)
    if (site.value) {
      expandedSites.push(site.value)
      clicks += site.value.analytics.period.totalClicks
      impressions += site.value.analytics.period.totalImpressions
      prevClicks += site.value.analytics.prevPeriod.totalClicks
      prevImpressions += site.value.analytics.prevPeriod.totalImpressions
    }
  }
  expandedSitesData.value = expandedSites.sort((a, b) => b.analytics.period.totalClicks - a.analytics.period.totalClicks)
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
}, {
  immediate: import.meta.client,
})

const graph = computed(() => {
  const dates: Record<string, NonNullable<unknown>> = {}
  // need to combine all site data
  for (const _site of expandedSitesData.value!) {
    const rows = _site.dates?.rows || []
    for (const date in rows) {
      if (!dates[date]) {
        dates[date] = {
          date,
          clicks: 0,
          impressions: 0,
        }
      }
      dates[date].clicks += rows[date].clicks
      dates[date].impressions += rows[date].impressions
    }
  }
  // const rows = data.value?.dates?.rows
  // if (!rows)
  //   return []
  // const dates = Object.keys(rows)
  let clicks = Object.keys(dates).map(date => dates[date].clicks)
  let impressions = Object.keys(dates).map(date => dates[date].impressions)

  let smoothLineFn = (x: number[]) => x
  if (session.value.smoothLines === 'ema')
    smoothLineFn = exponentialMovingAverage
  else if (session.value.smoothLines === 'sma')
    smoothLineFn = simpleMovingAverage
  clicks = smoothLineFn(clicks)
  impressions = smoothLineFn(impressions)
  return {
    key: `${session.value.smoothLines}-${session.value.metricFilter}:${Object.keys(dates).length}`,
    clicks: clicks.map((value, index) => ({ time: Object.keys(dates)[index], value })),
    impressions: impressions.map((value, index) => ({ time: Object.keys(dates)[index], value })),
  }
})

const highestSiteClicks = computed(() => {
  let highest = 0
  for (const _site of expandedSitesData.value!) {
    if (_site.analytics.period.totalClicks > highest)
      highest = _site.analytics.period.totalClicks
  }
  return highest
})

const highestSiteImpressions = computed(() => {
  let highest = 0
  for (const _site of expandedSitesData.value!) {
    if (_site.analytics.period.totalImpressions > highest)
      highest = _site.analytics.period.totalImpressions
  }
  return highest
})
</script>

<template>
  <UContainer>
    <div class="py-10">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:gap-10">
          <div class="mb-3 md:mb-0">
            <h2 class="text-2xl font-bold mb-1 flex items-center gap-2">
              <UIcon name="i-heroicons-heart" />
              <span>Cumulative Health</span>
            </h2>
            <p class="text-gray-400 text-sm">
              See how all of your sites are performance cumulatively.
            </p>
          </div>
        </div>
      </div>
      <div v-if="allSitesTotal">
        <div class="flex gap-10 mb-10">
          <UCard class="flex flex-col justify-center  px-8 py-3">
            <div class="flex items-center gap-1">
              <span class="text-lg opacity-70">Clicks</span>
            </div>
            <div class="text-3xl flex items-end gap-2">
              <span>{{ useHumanFriendlyNumber(allSitesTotal.period.totalClicks) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="w-5 h-5 opacity-80"><path fill="#888888" d="m11.5 11l6.38 5.37l-.88.18l-.64.12c-.63.13-.99.83-.71 1.4l.27.58l1.36 2.94l-1.42.66l-1.36-2.93l-.26-.58a.985.985 0 0 0-1.52-.36l-.51.4l-.71.57zm-.74-2.31a.76.76 0 0 0-.76.76V20.9c0 .42.34.76.76.76c.19 0 .35-.06.48-.16l1.91-1.55l1.66 3.62c.13.27.4.43.69.43c.11 0 .22 0 .33-.08l2.76-1.28c.38-.18.56-.64.36-1.01L17.28 18l2.41-.45a.88.88 0 0 0 .43-.26c.27-.32.23-.79-.12-1.08l-8.74-7.35l-.01.01a.756.756 0 0 0-.49-.18M15 10V8h5v2zm-1.17-5.24l2.83-2.83l1.41 1.41l-2.83 2.83zM10 0h2v5h-2zM3.93 14.66l2.83-2.83l1.41 1.41l-2.83 2.83zm0-11.32l1.41-1.41l2.83 2.83l-1.41 1.41zM7 10H2V8h5z" /></svg>
            </div>
            <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="allSitesTotal.period.totalClicks" :prev-value="allSitesTotal.prevPeriod.totalClicks" />
          </UCard>
          <UCard class="flex flex-col justify-center px-8 py-3">
            <div class="flex items-center gap-1">
              <span class="text-lg opacity-70">Impressions</span>
            </div>
            <div class="text-3xl flex items-end gap-2">
              <span>{{ useHumanFriendlyNumber(allSitesTotal.period.totalImpressions) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="0" height="24" viewBox="0 0 32 32" class="w-5 h-5 opacity-80"><path fill="#888888" d="M30.94 15.66A16.69 16.69 0 0 0 16 5A16.69 16.69 0 0 0 1.06 15.66a1 1 0 0 0 0 .68A16.69 16.69 0 0 0 16 27a16.69 16.69 0 0 0 14.94-10.66a1 1 0 0 0 0-.68ZM16 25c-5.3 0-10.9-3.93-12.93-9C5.1 10.93 10.7 7 16 7s10.9 3.93 12.93 9C26.9 21.07 21.3 25 16 25Z" /><path fill="#888888" d="M16 10a6 6 0 1 0 6 6a6 6 0 0 0-6-6Zm0 10a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" /></svg>
            </div>
            <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="allSitesTotal.period.totalImpressions" :prev-value="allSitesTotal.prevPeriod.totalImpressions" />
          </UCard>
        </div>
        <div class="mb-3 md:mb-0 flex items-center md:justify-center gap-2 md:gap-5">
          <div class="w-[500px] space-y-5">
            <div v-for="site in expandedSitesData" :key="site.domain">
              <NuxtLink to="/" class="flex items-center gap-2 mb-2">
                <img :src="`https://www.google.com/s2/favicons?domain=${withHttps(site.domain)}`" alt="favicon" class="w-4 h-4">
                <div>
                  <h3 class="font-bold">
                    {{ useFriendlySiteUrl(site.domain) }}
                  </h3>
                  <div class="text-xs text-gray-400 -mt-1">
                    <template v-if="useTimeMonthsAgo(site?.dates?.startDate) >= 16">
                      Data since {{ useTimeMonthsAgo(site?.dates?.startDate) }} months ago
                    </template>
                    <template v-else>
                      Data since {{ useTimeAgo(site?.dates?.startDate, true) }}
                    </template>
                  </div>
                </div>
              </NuxtLink>
              <!--              we want to show the % of clicks of the total here  -->
              <UProgress size="sm" class="opacity-75 group-hover:opacity-100 transition mb-1" color="blue" :value="(site.analytics.period.totalClicks / highestSiteClicks) * 100" />
              <UProgress size="sm" class="opacity-75 group-hover:opacity-100 transition" color="purple" :value="(site.analytics.period.totalImpressions / highestSiteImpressions) * 100" />
            </div>
          </div>
          <GraphExpanded :key="graph.key" height="500" :value="session.metricFilter !== 'clicks' ? graph.clicks : []" :value2="session.metricFilter !== 'impressions' ? graph.impressions : []" />
        </div>
      </div>
    </div>
  </UContainer>
</template>

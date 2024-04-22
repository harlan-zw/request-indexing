<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'
import CardTopCountries from '~/components/Card/CardTopCountries.vue'

const props = defineProps<{ data: any, site: any }>()

const { user } = useUserSession()

useHead({
  title: 'Overview',
  icon: 'i-heroicons-home',
})

const siteData = useSiteData(props.site)
// const { data: dates } = siteData.dates()
const { data: pages } = siteData.pages()
const { data: analytics } = siteData.analytics()
const { data: devices } = siteData.devices()
const { data: countries } = siteData.countries()

const deviceClicksSum = computed(() => {
  if (!devices.value?.period)
    return 0
  return devices.value.period.reduce((acc, device) => acc + device.clicks, 0)
})
const devicePrevClicksSum = computed(() => {
  if (!devices.value?.prevPeriod)
    return 0
  return devices.value.prevPeriod.reduce((acc, device) => acc + device.clicks || 0, 0)
})

// 1. Trending Content: Identify content that is gaining popularity or showing significant improvement in performance.
// 2. Top Performing Pages: List the top 5 pages with the most clicks or highest growth in traffic.
// 3. Top Queries: Show the top 5 search queries driving traffic to the site.
const trendingContent = computed(() => {
  if (!pages.value?.rows)
    return []
  // we figure out the % change in clicks and only return top % change
  const rows = pages.value.rows
    .filter(row => row.prevClicks > 10) // avoid showing pages with very low clicks
    .map((row) => {
      const prev = Number(row.prevClicks)
      const current = Number(row.clicks)
      const percent = prev === 0 ? 0 : (current - prev) / ((prev + current) / 2) * 100
      return {
        ...row,
        percent,
      }
    })
    .filter(row => row.percent > 0)
  return rows.sort((a, b) => b.percent - a.percent).slice(0, 5)
})
</script>

<template>
  <div>
    <UPageHeader :headline="useFriendlySiteUrl(site.domain)">
      <template #title>
        <div class="flex items-center gap-3">
          <UIcon :name="$route.meta.icon" />
          {{ $route.meta.title }}
        </div>
      </template>
      <template #links>
        <div v-if="analytics" class="lg:flex items-center justify-center gap-10 hidden ">
          <div class="flex flex-col justify-center">
            <span class="text-sm opacity-70">Clicks</span>
            <div class="text-xl flex items-end gap-2">
              <span>{{ useHumanFriendlyNumber(analytics.period.clicks) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="w-5 h-5 opacity-80"><path fill="#888888" d="m11.5 11l6.38 5.37l-.88.18l-.64.12c-.63.13-.99.83-.71 1.4l.27.58l1.36 2.94l-1.42.66l-1.36-2.93l-.26-.58a.985.985 0 0 0-1.52-.36l-.51.4l-.71.57zm-.74-2.31a.76.76 0 0 0-.76.76V20.9c0 .42.34.76.76.76c.19 0 .35-.06.48-.16l1.91-1.55l1.66 3.62c.13.27.4.43.69.43c.11 0 .22 0 .33-.08l2.76-1.28c.38-.18.56-.64.36-1.01L17.28 18l2.41-.45a.88.88 0 0 0 .43-.26c.27-.32.23-.79-.12-1.08l-8.74-7.35l-.01.01a.756.756 0 0 0-.49-.18M15 10V8h5v2zm-1.17-5.24l2.83-2.83l1.41 1.41l-2.83 2.83zM10 0h2v5h-2zM3.93 14.66l2.83-2.83l1.41 1.41l-2.83 2.83zm0-11.32l1.41-1.41l2.83 2.83l-1.41 1.41zM7 10H2V8h5z" /></svg>
            </div>
            <TrendPercentage v-if="user.analyticsPeriod !== 'all'" :value="analytics.period.clicks" :prev-value="analytics.prevPeriod.clicks" />
          </div>
          <div class="flex flex-col justify-center">
            <span class="text-sm opacity-70">Impressions</span>
            <div class="text-xl flex items-end gap-2">
              <span>{{ useHumanFriendlyNumber(analytics.period.impressions) }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="0" height="24" viewBox="0 0 32 32" class="w-5 h-5 opacity-80"><path fill="#888888" d="M30.94 15.66A16.69 16.69 0 0 0 16 5A16.69 16.69 0 0 0 1.06 15.66a1 1 0 0 0 0 .68A16.69 16.69 0 0 0 16 27a16.69 16.69 0 0 0 14.94-10.66a1 1 0 0 0 0-.68ZM16 25c-5.3 0-10.9-3.93-12.93-9C5.1 10.93 10.7 7 16 7s10.9 3.93 12.93 9C26.9 21.07 21.3 25 16 25Z" /><path fill="#888888" d="M16 10a6 6 0 1 0 6 6a6 6 0 0 0-6-6Zm0 10a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" /></svg>
            </div>
            <TrendPercentage v-if="user.analyticsPeriod !== 'all'" :value="analytics.period.impressions" :prev-value="analytics.prevPeriod.impressions" />
          </div>
        </div>
      </template>
    </UPageHeader>
    <UPageBody>
      <div class="relative z-3 ">
        <div class="flex items-center justify-between gap-10 mb-5 md:mb-12">
          <div class="flex items-center gap-7">
            <div class="lg:flex items-center gap-3 hidden ">
              <MetricGuage v-if="data?.requiresActionPercent" :score="data.requiresActionPercent">
                <div class="text-xl">
                  {{ data.requiresActionPercent === -1 ? '?' : Math.round(data.requiresActionPercent * 100) }}
                </div>
              </MetricGuage>
              <div class="text-sm text-gray-500">
                % Pages Indexed
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-10 ">
        <div class="space-y-10">
          <UCard v-if="devices">
            <template #header>
              Devices
            </template>
            <div class="space-y-5">
              <div v-for="(device, i) in devices.period" :key="i" class="">
                <ProgressPercent :value="device.clicks" :total="deviceClicksSum">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <UIcon v-if="device.device === 'TABLET'" name="i-heroicons-device-tablet" class="w-5 h-5" />
                      <UIcon v-else :name="device.device === 'DESKTOP' ? 'i-heroicons-computer-desktop' : 'i-heroicons-device-phone-mobile' " class="w-5 h-5" />
                      <span class="text-lg text-gray-600 capitalize">{{ device.device.toLowerCase() }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex items-center gap-2">
                        <div class="text-sm text-gray-500">
                          {{ useHumanFriendlyNumber(device.clicks / deviceClicksSum * 100) }}%
                        </div>
                        <TrendPercentage symbol="%" :value="device.clicks / deviceClicksSum * 100" :prev-value="(devices.prevPeriod?.[i]?.clicks || 0) / devicePrevClicksSum * 100" />
                      </div>
                    </div>
                  </div>
                </ProgressPercent>
              </div>
            </div>
          </UCard>
          <CardTrendingContent :trending-content="trendingContent" />
        </div>
        <div class="space-y-10">
          <CardTopCountries v-if="countries" :countries="countries" />
        </div>
      </div>
    </UPageBody>
  </div>
</template>

<script lang="ts" setup>
import { useFriendlySiteUrl } from '~/composables/formatting'
import type { GoogleSearchConsoleSite } from '~/types'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{
  site: GoogleSearchConsoleSite
  selectedCharts: string[]
}>()

const emits = defineEmits<{
  toggleChart: [chart: string]
}>()

const { site } = toRefs(props)

const { user } = useUserSession()

// const { data: _data, pending: _pending, forceRefresh, error } = await fetchSite(site.value, !!props.mockData)

// const { data: indexing } = clientSharedAsyncData(`sites:${site.value.domain}:indexing`, async () => {
//   return $fetch(`/services/sites/${encodeURIComponent(siteId.value)}/indexing`)
// })

const siteData = useSiteData(props.site)
const { data: dates } = siteData.dates()
const { data: analytics } = siteData.analytics()

// const isForceRefreshing = ref(false)
// const pending = computed(() => {
//   if (props.mockData)
//     return false
//   return toValue(_pending) || toValue(isForceRefreshing)
// })
// const data = toRef(props.mockData || _data) as Ref<SiteExpanded | null>

// function refresh() {
//   // callFnSyncToggleRef(forceRefresh, isForceRefreshing)
// }
//
// async function hide() {
//   const sites = new Set([...session.value.user.selectedSites])
//   sites.delete(site.value.domain)
//   // save it upstream
//   session.value = await $fetch('/api/user/me', {
//     method: 'POST',
//     body: JSON.stringify({ selectedSites: [...sites] }),
//   })
// }

const graph = computed(() => {
  if (!dates?.value?.rows?.length) {
    return {
      clicks: [],
      impressions: [],
      position: [],
      ctr: [],
    }
  }
  const rows = dates.value.rows
  const _dates = rows.map(row => row.date)
  const clicks = rows.map(row => row.clicks)
  const impressions = rows.map(row => row.impressions)
  const position = rows.map(row => row.position)
  const ctr = rows.map(row => row.ctr)
  // let smoothLineFn = (x: number[]) => x
  // if (session.value.smoothLines === 'ema')
  //   smoothLineFn = exponentialMovingAverage
  // else if (session.value.smoothLines === 'sma')
  //   smoothLineFn = simpleMovingAverage
  // clicks = smoothLineFn(clicks)
  // impressions = smoothLineFn(impressions)
  return {
    clicks: clicks.map((value, index) => ({ time: _dates[index], value })),
    impressions: impressions.map((value, index) => ({ time: _dates[index], value })),
    position: position.map((value, index) => ({ time: _dates[index], value })),
    ctr: ctr.map((value, index) => ({ time: _dates[index], value: value * 100 })),
  }
})

const tooltipData = ref()
function syncTooltip(data) {
  tooltipData.value = data
}

function toggleChart(chart: string) {
  emits('toggleChart', chart)
}

const expanded = ref(false)
console.log(site)
const indexedPercent = computed(() => {
  return Math.round(props.site.pageCountIndexed / props.site.pageCount * 100)
})
</script>

<template>
  <div>
    <div v-if="analytics" class="">
      <div class="flex gap-5">
        <div>
          <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/overview`" class="mx-2 mb-2 flex items-center gap-1">
            <img :src="`https://www.google.com/s2/favicons?domain=${site.domain}`" alt="favicon" class="w-4 h-4">
            <div>
              <h2 class="font-bold">
                {{ useFriendlySiteUrl(site.domain) }}
              </h2>
            </div>
          </NuxtLink>
          <UCard class="flex flex-col" :ui="{ body: { base: 'flex-grow flex items-center', padding: 'px-0 py-0 sm:p-0' }, header: { padding: 'px-2 py-3 sm:px-3' }, footer: { padding: 'px-2 py-3 sm:px-3' } }">
            <div class="">
              <div class="flex">
                <button type="button" class="w-[125px] p-2 transition" :class="selectedCharts.includes('clicks') ? 'bg-blue-50' : ''" @click="toggleChart('clicks')">
                  <div>
                    <div class="text-xs text-gray-500 flex items-center gap-1">
                      <IconClicks class="w-4 h-4 opacity-80" />
                      <div>Clicks</div>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="text-2xl font-semibold">{{ useHumanFriendlyNumber(tooltipData?.clicks || analytics.period.clicks) }}</span>
                      <TrendPercentage v-if="user?.analyticsPeriod !== 'all' && !tooltipData?.clicks" :value="analytics.period.clicks" :prev-value="analytics.prevPeriod?.clicks" />
                    </div>
                  </div>
                </button>
                <button type="button" class="w-[125px] p-2 transition" :class="selectedCharts.includes('impressions') ? 'bg-purple-50' : ''" @click="toggleChart('impressions')">
                  <div>
                    <div class="text-xs text-gray-500 flex items-center gap-1">
                      <IconImpressions class="w-4 h-4 opacity-80" />
                      <div>Impressions</div>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class=" text-2xl font-semibold">{{ useHumanFriendlyNumber(tooltipData?.impressions || analytics.period.impressions) }}</span>
                      <TrendPercentage v-if="user?.analyticsPeriod !== 'all' && !tooltipData?.impressions" :value="analytics.period.impressions" :prev-value="analytics.prevPeriod?.impressions" />
                    </div>
                  </div>
                </button>
                <button type="button" class="w-[125px] p-2 transition" :class="selectedCharts.includes('position') ? 'bg-orange-50' : ''" @click="toggleChart('position')">
                  <div>
                    <div class="text-xs text-gray-500 flex items-center gap-1">
                      <IconPosition class="w-4 h-4 opacity-80" />
                      <div>Position</div>
                    </div>
                    <div class="flex items-center gap-1">
                      <span class="text-xl font-semibold">{{ useHumanFriendlyNumber(tooltipData?.position || analytics.period.position) }}</span>
                      <TrendPercentage v-if="user?.analyticsPeriod !== 'all' && !tooltipData" :value="analytics.period.position" :prev-value="analytics.prevPeriod?.position" />
                    </div>
                  </div>
                </button>
              </div>
              <div class="w-[375px] h-[150px] relative">
                <div v-if="tooltipData?.time" class="absolute top-1 w-full text-center">
                  {{ $dayjs(tooltipData?.time).format('MMMM D, YYYY') }}
                </div>
                <GraphGoogleSearchConsole :key="selectedCharts.length" height="150" :value="graph" :charts="selectedCharts" @tooltip="syncTooltip" />
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

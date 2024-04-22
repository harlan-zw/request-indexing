<script lang="ts" setup>
import { useFriendlySiteUrl } from '~/composables/formatting'
import type { GoogleSearchConsoleSite } from '~/types'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{
  site: GoogleSearchConsoleSite
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
  if (!dates?.value?.rows?.length)
    return []
  const rows = dates.value.rows
  const _dates = rows.map(row => row.date)
  const clicks = rows.map(row => row.clicks)
  const impressions = rows.map(row => row.impressions)
  // let smoothLineFn = (x: number[]) => x
  // if (session.value.smoothLines === 'ema')
  //   smoothLineFn = exponentialMovingAverage
  // else if (session.value.smoothLines === 'sma')
  //   smoothLineFn = simpleMovingAverage
  // clicks = smoothLineFn(clicks)
  // impressions = smoothLineFn(impressions)
  return {
    // key: `${session.value.smoothLines}-${session.value.metricFilter}`,
    clicks: clicks.map((value, index) => ({ time: _dates[index], value })),
    impressions: impressions.map((value, index) => ({ time: _dates[index], value })),
  }
})

const graph2 = computed(() => {
  if (!dates.value?.rows?.length) {
    return {
      position: [],
      ctr: [],
    }
  }
  const rows = dates.value.rows
  const _dates = rows.map(row => row.date)
  const position = rows.map(row => row.position)
  const ctr = rows.map(row => row.ctr)
  // let smoothLineFn = (x: number[]) => x
  // if (session.value.smoothLines === 'ema')
  //   smoothLineFn = exponentialMovingAverage
  // else if (session.value.smoothLines === 'sma')
  //   smoothLineFn = simpleMovingAverage
  // position = smoothLineFn(position)
  // ctr = smoothLineFn(ctr)
  return {
    // key: `${session.value.smoothLines}-${session.value.metricFilter}`,
    position: position.map((value, index) => ({ time: _dates[index], value })),
    ctr: ctr.map((value, index) => ({ time: _dates[index], value: value * 100 })),
  }
})

const expanded = ref(false)
console.log(site)
const indexedPercent = computed(() => {
  return Math.round(props.site.pageCountIndexed / props.site.pageCount * 100)
})
</script>

<template>
  <div class="grid grid-cols-12">
    <div class="col-span-3 flex items-start justify-start gap-2">
      <UButton :icon="expanded ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" color="gray" size="xs" variant="ghost" @click="expanded = !expanded" />
      <div>
        <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/overview`" class="flex items-center gap-2">
          <img :src="`https://www.google.com/s2/favicons?domain=${site.domain}`" alt="favicon" class="w-4 h-4">
          <div>
            <h3 class="font-bold">
              {{ useFriendlySiteUrl(site.domain) }}
            </h3>
          </div>
        </NuxtLink>
      </div>
    </div>
    <div v-if="analytics" class=" col-span-9">
      <div class="flex gap-5">
        <div class="flex flex-col items-center justify-center gap-2">
          <UTooltip>
            <div class="flex items-center gap-2">
              <span>{{ useHumanFriendlyNumber(site.psiAverageMobileScore * 100) }}%</span>
            </div>
          </UTooltip>
          <div class="text-xs">
            Mobile Score
          </div>
        </div>
        <div class="flex flex-col items-center justify-center gap-2">
          <UTooltip>
            <div class="flex items-center gap-2">
              <span>{{ useHumanFriendlyNumber(site.psiAverageDesktopScore * 100) }}%</span>
            </div>
          </UTooltip>
          <div class="text-xs">
            Desktop Score
          </div>
        </div>
        <div class="flex flex-col items-center justify-center gap-2">
          <UTooltip>
            <div class="flex items-center gap-2">
              <span>{{ useHumanFriendlyNumber(indexedPercent) }}%</span>
            </div>
          </UTooltip>
          <div class="text-xs">
            Indexed
          </div>
        </div>
        <div class="flex flex-col items-center justify-center gap-2">
          <UTooltip>
            <div class="flex items-center gap-2">
              <span>{{ useHumanFriendlyNumber(site.pageCount) }}</span>
            </div>
          </UTooltip>
          <div class="text-xs">
            Pages
          </div>
        </div>
        <div v-if="!(user?.disabledMetrics || []).includes('clicks')" class="flex flex-col items-center justify-center gap-2">
          <UTooltip :text="user?.analyticsPeriod === 'all' ? 'Clicks All Time' : `Clicks last ${user?.analyticsPeriod || '28d'}`">
            <div class="flex items-center gap-2">
              <span>{{ useHumanFriendlyNumber(analytics.period.clicks) }}</span>
              <IconClicks />
            </div>
          </UTooltip>
          <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="analytics.period.clicks" :prev-value="analytics.prevPeriod?.clicks" />
        </div>
        <div v-if="!(user?.disabledMetrics || []).includes('impressions')" class="flex flex-col items-center justify-center gap-2">
          <UTooltip :text="user?.analyticsPeriod === 'all' ? 'Impressions All Time' : `Impressions last ${user?.analyticsPeriod || '28d'}`" class="flex items-end gap-2">
            <div class="flex items-center gap-2">
              <span>{{ useHumanFriendlyNumber(analytics.period.impressions) }}</span>
              <IconImpressions />
            </div>
          </UTooltip>
          <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="analytics.period.impressions" :prev-value="analytics.prevPeriod?.impressions" />
        </div>
        <div v-if="!(user?.disabledMetrics || []).includes('position')" class="flex flex-col items-center justify-center gap-2">
          <UTooltip :text="user?.analyticsPeriod === 'all' ? 'Clicks All Time' : `Clicks last ${user?.analyticsPeriod || '28d'}`">
            <PositionMetric :value="analytics.period.position" class="text-2xl" />
          </UTooltip>
          <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" negative :value="analytics.period.position" :prev-value="analytics.prevPeriod?.position" />
        </div>
        <div v-if="!(user?.disabledMetrics || []).includes('ctr')" class="flex flex-col items-center justify-center gap-2">
          <UTooltip :text="user?.analyticsPeriod === 'all' ? 'Impressions All Time' : `Impressions last ${user?.analyticsPeriod || '28d'}`" class="flex items-end gap-2">
            <div class="flex items-center gap-2">
              <span>{{ useHumanFriendlyNumber(analytics.period.ctr * 100) }}%</span>
              <IconCtr />
            </div>
          </UTooltip>
          <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="analytics.period.ctr" :prev-value="analytics.prevPeriod?.ctr" />
        </div>
      </div>
      <div class="flex">
        <div v-if="expanded" class="h-[100px] max-w-full overflow-hidden">
          <GraphClicks :key="graph.key" :value="!(user?.disabledMetrics || []).includes('clicks') ? graph.clicks : []" :value2="!(user?.disabledMetrics || []).includes('impressions') ? graph.impressions : []" />
        </div>
        <div v-if="expanded" class="h-[100px] max-w-full overflow-hidden">
          <ClientOnly>
            <GraphKeywords :value="graph2.position" :value2="graph2.ctr" />
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>
</template>

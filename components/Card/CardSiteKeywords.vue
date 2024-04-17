<script lang="ts" setup>
import { withHttps } from 'ufo'
import { useFriendlySiteUrl, useTimeMonthsAgo } from '~/composables/formatting'
import type { GoogleSearchConsoleSite, SiteExpanded } from '~/types'
import { useSiteData } from '~/composables/fetch'
import { exponentialMovingAverage } from '~/lib/time-smoothing/exponentialMovingAverage'
import { simpleMovingAverage } from '~/lib/time-smoothing/simpleMovingAverage'

const props = defineProps<{
  site: GoogleSearchConsoleSite
  mockData?: SiteExpanded
}>()

const { site } = toRefs(props)

const { session, user } = useUserSession()

const siteId = computed(() => site.value.domain)

// const { data: _data, pending: _pending, forceRefresh, error } = await fetchSite(site.value, !!props.mockData)

// const { data: indexing } = clientSharedAsyncData(`sites:${site.value.domain}:indexing`, async () => {
//   return $fetch(`/services/sites/${encodeURIComponent(siteId.value)}/indexing`)
// })

const siteData = useSiteData(site.value)
const { data: dates } = siteData.dates()
const { data: analytics } = siteData.analytics()

// const isForceRefreshing = ref(false)
// const pending = computed(() => {
//   if (props.mockData)
//     return false
//   return toValue(_pending) || toValue(isForceRefreshing)
// })
// const data = toRef(props.mockData || _data) as Ref<SiteExpanded | null>

const link = computed(() => `/dashboard/site/${encodeURIComponent(siteId.value)}/overview`)

function refresh() {
  // callFnSyncToggleRef(forceRefresh, isForceRefreshing)
}

async function hide() {
  const sites = new Set([...session.value.user.selectedSites])
  sites.delete(site.value.domain)
  // save it upstream
  session.value = await $fetch('/api/user/me', {
    method: 'POST',
    body: JSON.stringify({ selectedSites: [...sites] }),
  })
}

const graph = computed(() => {
  if (!dates.value?.rows?.length)
    return []
  const rows = dates.value.rows
  const _dates = rows.map(row => row.date)
  let position = rows.map(row => row.position)
  let ctr = rows.map(row => row.ctr)
  let smoothLineFn = (x: number[]) => x
  if (session.value.smoothLines === 'ema')
    smoothLineFn = exponentialMovingAverage
  else if (session.value.smoothLines === 'sma')
    smoothLineFn = simpleMovingAverage
  position = smoothLineFn(position)
  ctr = smoothLineFn(ctr)
  return {
    key: `${session.value.smoothLines}-${session.value.metricFilter}`,
    position: position.map((value, index) => ({ time: _dates[index], value })),
    ctr: ctr.map((value, index) => ({ time: _dates[index], value: value * 100 })),
  }
})
</script>

<template>
  <UCard class="min-h-[270px] flex flex-col" :ui="{ body: { base: 'flex-grow flex items-center', padding: 'px-0 py-0 sm:p-0' }, header: { padding: 'px-2 py-3 sm:px-3' }, footer: { padding: 'px-2 py-3 sm:px-3' } }">
    <template #header>
      <div class="flex justify-between">
        <NuxtLink :to="link" class="flex items-center gap-2">
          <img :src="`https://www.google.com/s2/favicons?domain=${withHttps(siteId)}`" alt="favicon" class="w-4 h-4">
          <div>
            <h3 class="font-bold">
              {{ useFriendlySiteUrl(siteId) }}
            </h3>
            <div v-if="user?.analyticsPeriod === 'all'" class="text-xs text-gray-400 -mt-1">
              <template v-if="useTimeMonthsAgo(dates?.startDate) >= 16">
                Data since {{ useTimeMonthsAgo(dates?.startDate) }} months ago
              </template>
              <template v-else>
                Data since {{ useTimeAgo(dates?.startDate, true) }}
              </template>
            </div>
          </div>
        </NuxtLink>
        <UDropdown :class="mockData ? 'pointer-events-none' : ''" :items="[[{ label: 'View', icon: 'i-heroicons-eye', click: () => link && navigateTo(link) }, { label: 'Reload', icon: 'i-heroicons-arrow-path', click: refresh }, { label: 'Hide', icon: 'i-heroicons-trash', click: hide }]]" :popper="{ offsetDistance: 0, placement: 'right-start' }">
          <UButton color="white" label="" variant="ghost" trailing-icon="i-heroicons-chevron-down" />
        </UDropdown>
      </div>
    </template>
    <div class="flex-grow w-full h-full">
      <div class="relative w-full h-full">
        <div class="flex px-5 pt-2 items-start justify-between gap-7">
          <div v-if="analytics" class="flex flex-col items-end justify-end text-gray-600 dark:text-gray-300">
            <div v-if="!(user?.disabledMetrics || []).includes('position')" class="flex items-center justify-center gap-2">
              <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="analytics.period.position" :prev-value="analytics.prevPeriod?.position" />
              <UTooltip :text="user?.analyticsPeriod === 'all' ? 'Clicks All Time' : `Clicks last ${user?.analyticsPeriod || '28d'}`">
                <PositionMetric :value="analytics.period.position" />
              </UTooltip>
            </div>
            <div v-if="!(user?.disabledMetrics || []).includes('ctr')" class="flex items-center justify-center gap-2">
              <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="analytics.period.ctr" :prev-value="analytics.prevPeriod?.ctr" />
              <UTooltip :text="user?.analyticsPeriod === 'all' ? 'Impressions All Time' : `Impressions last ${user?.analyticsPeriod || '28d'}`" class="flex items-end gap-2">
                <div class="flex items-center gap-2">
                  <span>{{ useHumanFriendlyNumber(analytics.period.ctr * 100) }}%</span>
                  <IconCtr />
                </div>
              </UTooltip>
            </div>
          </div>
        </div>
        <div v-if="graph" class="h-[100px] max-w-full overflow-hidden">
          <GraphKeywords :key="graph.key" :value="!(user?.disabledMetrics || []).includes('position') ? graph.position : []" :value2="!(user?.disabledMetrics || []).includes('ctr') ? graph.ctr : []" />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex items-center justify-between">
        <div class="flex gap-2 items-center ">
          <UButton :class="mockData ? 'pointer-events-none' : ''" variant="ghost" color="gray" :to="link">
            View
          </UButton>
        </div>

        <div class="flex items-center gap-2">
          <div class="opacity-60 text-xs">
            <template v-if="site.property.includes('sc-domain:')">
              Domain Property
            </template>
            <template v-else>
              Site Property
            </template>
          </div>
          <UTooltip v-if="!mockData && site.permissionLevel !== 'siteOwner'" :text="`'${site.permissionLevel}' is unable to submit URLs for indexing`">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500" />
          </UTooltip>
          <UTooltip v-else text="You can submit URLs for indexing for this site.">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
          </UTooltip>
        </div>
      </div>
    </template>
  </UCard>
</template>

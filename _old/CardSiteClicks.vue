<script lang="ts" setup>
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
  if (!dates?.value?.rows?.length)
    return []
  const rows = dates.value.rows
  const _dates = rows.map(row => row.date)
  let clicks = rows.map(row => row.clicks)
  let impressions = rows.map(row => row.impressions)
  let smoothLineFn = (x: number[]) => x
  if (session.value.smoothLines === 'ema')
    smoothLineFn = exponentialMovingAverage
  else if (session.value.smoothLines === 'sma')
    smoothLineFn = simpleMovingAverage
  clicks = smoothLineFn(clicks)
  impressions = smoothLineFn(impressions)
  return {
    key: `${session.value.smoothLines}-${session.value.metricFilter}`,
    clicks: clicks.map((value, index) => ({ time: _dates[index], value })),
    impressions: impressions.map((value, index) => ({ time: _dates[index], value })),
  }
})
</script>

<template>
  <UCard class="min-h-[270px] flex flex-col" :ui="{ body: { base: 'flex-grow flex items-center', padding: 'px-0 py-0 sm:p-0' }, header: { padding: 'px-2 py-3 sm:px-3' }, footer: { padding: 'px-2 py-3 sm:px-3' } }">
    <template #header>
      <div class="flex justify-between">
        <NuxtLink :to="link" class="flex items-center gap-2">
          <SiteFavicon :site="site" />
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
      <!--      <div v-if="pending" class="w-full h-full flex items-center justify-center"> -->
      <!--        <UIcon name="i-heroicons-arrow-path" class="animate-spin w-12 h-12" /> -->
      <!--      </div> -->
      <!--      <div v-else-if="error" class="w-full h-full flex items-center justify-center"> -->
      <!--        <div> -->
      <!--          <div class="mb-3"> -->
      <!--            <div class="text-lg font-semibold"> -->
      <!--              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" /> Failed to refresh -->
      <!--            </div> -->
      <!--            <div class="opacity-80 text-sm"> -->
      <!--              {{ error.statusMessage }} -->
      <!--            </div> -->
      <!--          </div> -->
      <!--          <UButton size="xs" color="gray" @click="refresh"> -->
      <!--            Refresh -->
      <!--          </UButton> -->
      <!--        </div> -->
      <!--      </div> -->
      <div class="relative w-full h-full">
        <div class="flex px-5 pt-2 items-start justify-between gap-7">
          <!--          <div class="flex items-center justify-center gap-2"> -->
          <!--            <div class="flex items-center flex-col justify-center"> -->
          <!--              <div class="text-2xl font-semibold"> -->
          <!--                <template v-if="data.requiresActionPercent && data.requiresActionPercent !== -1"> -->
          <!--                  {{ Math.round(data.requiresActionPercent * 100) }}<span class="text-xl">%</span> -->
          <!--                </template> -->
          <!--                <template v-else> -->
          <!--                  ? -->
          <!--                </template> -->
          <!--              </div> -->
          <!--              <div class="opacity-80 text-sm"> -->
          <!--                Indexed -->
          <!--              </div> -->
          <!--            </div> -->
          <!--          </div> -->
          <div v-if="analytics" class="flex flex-col items-end justify-end text-gray-600 dark:text-gray-300">
            <div v-if="!(user?.disabledMetrics || []).includes('clicks')" class="flex items-center justify-center gap-2">
              <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="analytics.period.clicks" :prev-value="analytics.prevPeriod?.clicks" />
              <UTooltip :text="user?.analyticsPeriod === 'all' ? 'Clicks All Time' : `Clicks last ${user?.analyticsPeriod || '28d'}`">
                <div class="flex items-center gap-2">
                  <span>{{ useHumanFriendlyNumber(analytics.period.clicks) }}</span>
                  <IconClicks />
                </div>
              </UTooltip>
            </div>
            <div v-if="!(user?.disabledMetrics || []).includes('impressions')" class="flex items-center justify-center gap-2">
              <TrendPercentage v-if="user?.analyticsPeriod !== 'all'" :value="analytics.period.impressions" :prev-value="analytics.prevPeriod?.impressions" />
              <UTooltip :text="user?.analyticsPeriod === 'all' ? 'Impressions All Time' : `Impressions last ${user?.analyticsPeriod || '28d'}`" class="flex items-end gap-2">
                <div class="flex items-center gap-2">
                  <span>{{ useHumanFriendlyNumber(analytics.period.impressions) }}</span>
                  <IconImpressions />
                </div>
              </UTooltip>
            </div>
          </div>
        </div>
        <div v-if="graph" class="h-[100px] max-w-full overflow-hidden">
          graph
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

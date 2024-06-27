<script lang="ts" setup>
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import { useSiteData } from '~/composables/fetch'
import TableCountries from '~/components/Table/TableCountries.vue'

const props = defineProps<{ site: any }>()

// const { user } = useUserSession()

definePageMeta({
  layout: 'dashboard',
  title: 'Overview',
  icon: 'i-ph-chart-bar-duotone',
})

const siteData = useSiteData(props.site)
const { data: _dates } = siteData.dateAnalytics()
const dates = computed(() => {
  if (!_dates.value)
    return null
  const period = _dates.value.period
  const prevPeriod = _dates.value.prevPeriod
  return {
    ..._dates.value,
    period: {
      ...period,
      indexedPercent: Math.round(period.indexedPagesCount / (period.totalPagesCount || 1) * 100),
    },
    prevPeriod: {
      ...prevPeriod,
      indexedPercent: Math.round(prevPeriod.indexedPagesCount / (prevPeriod.totalPagesCount || 1) * 100),
    },
  }
})

const sortFunction = (a, b) => a - b

const tabItems = [
  { label: 'Most Clicked', icon: 'i-ph-chart-bar-duotone', description: 'Show data by most clicks.' },
  { label: 'Improving', icon: 'i-ph-chart-line-up-duotone', filter: 'improving,with-clicks', description: 'Clicks improving compared to the previous period.' },
  { label: 'Declining', icon: 'i-ph-chart-line-down-duotone', filter: 'declining,with-clicks', description: 'Clicks diminishing compared to the previous period.' }
]
const tab = ref(0)
const currentTab = computed(() => {
  return tabItems[tab.value]
})
const currentTabFilter = computed(() => {
  return tabItems[tab.value].filter
})

const totalDeviceClicks = computed(() => {
  if (!dates.value?.devices)
    return 0
  return Object.values(dates.value.devices).reduce((acc, d) => acc + d, 0)
})
</script>

<template>
<div class="space-y-7">
  <div class="flex items-center gap-3">
    <div class="border border-dashed rounded-lg">
      <div class="max-w-sm">
        <UPopover :popper="{ placement: 'bottom-end' }">
          <template #default="{ open }">
          <UButton size="xs" color="gray" :icon="currentTab.icon" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid">
            <span class="truncate">{{ currentTab.label }}</span>
          </UButton>
          </template>
          <template #panel>
          <div v-for="(item, i) in tabItems" :key="i">
            <UButton   size="lg" color="gray" :icon="item.icon" variant="ghost" :class="[tab === i && 'bg-gray-50 dark:bg-gray-800']" @click="tab = i">
              <div class="flex flex-col items-start">
                <div class="truncate">{{ item.label }}</div>
                <div class="text-xs text-gray-500 max-w-[200px] text-left">{{ item.description }}</div>
              </div>
            </UButton>
          </div>
          </template>
        </UPopover>
      </div>
    </div>
    <div class="border border-dashed rounded-lg">
      <CalenderFilter />
    </div>
    <div class="border border-dashed rounded-lg">
      <LocationFilter />
    </div>
  </div>
  <div class="grid grid-cols-12 gap-7">
    <div class="col-span-9 space-y-7">
      <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
      <CardGoogleSearchConsole :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      </UCard>
      <div>
        <CardTitle>
          <NuxtLink :to="`/dashboard/site/${site.siteId}/pages`" class="hover:underline">
            Pages
          </NuxtLink>
        </CardTitle>
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <TablePagesNext :sort="tab === 0 ? undefined : { column: 'clicksPercent', direction: tab === 1 ? 'desc' : 'asc' }" :exclude-columns="['psiScore', 'actions']" :filter="currentTabFilter" :sortable="false" :searchable="false" :expandable="false" :site="site" :filters="[]" :page-size="5" />
        </UCard>
      </div>
      <div>
        <CardTitle>
          <NuxtLink class="hover:underline" :to="`/dashboard/site/${site.siteId}/keywords`">
            Keywords
          </NuxtLink>
        </CardTitle>
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <TableKeywordsNext :filter="currentTabFilter" :sort="tab === 0 ? undefined : { column: 'clicksPercent', direction: tab === 1 ? 'desc' : 'asc' }" :exclude-columns="['actions', 'impressionsPercent', 'position', 'actions', 'positionPercent', 'competitionIndex']" :sortable="false" :searchable="false" :expandable="false" :site="site" :filters="[]" :page-size="5" />
        </UCard>
      </div>
    </div>
    <div class="col-span-3 space-y-10">
      <div>
        <CardTitle>
          <NuxtLink class="hover:underline" :to="`/dashboard/site/${site.siteId}/countries`">
            Countries
          </NuxtLink>
        </CardTitle>
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <TableCountries :sort="tab === 0 ? undefined : { column: 'clicksPercent', direction: tab === 1 ? 'desc' : 'asc' }" :exclude-columns="['page', 'clicks', 'keyword', 'actions', 'impressions', 'impressionsPercent']" :filter="currentTabFilter" :sortable="false" :pagination="false" :searchable="false" :expandable="false" :site="site" :filters="[]" :page-size="5" />
        </UCard>
      </div>
      <div>
        <CardTitle>
          Devices
        </CardTitle>
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <div v-if="dates?.devices?.mobileClicks || dates?.devices?.desktopClicks" class="space-y-3">
            <div v-for="(key, device) in dates?.devices">
              <div class="flex items-center gap-1 text-sm">
                <span class="capitalize text-xs text-gray-500">{{ device.replace('Clicks', '') }}</span>
              </div>
              <div class="text-lg font-mono">
                <ProgressPercent :value="key" :total="totalDeviceClicks">
                {{ useHumanFriendlyNumber(key / totalDeviceClicks * 100, 0) }}%
                </ProgressPercent>
              </div>
            </div>
          </div>
          <div class="text-sm text-gray-600">No data yet, check back soon.</div>
        </UCard>
      </div>
    </div>
  </div>
</div>
</template>

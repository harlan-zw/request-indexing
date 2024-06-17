<script lang="ts" setup>
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import { useSiteData } from '~/composables/fetch'
import TableCountries from '~/components/Table/TableCountries.vue'

const props = defineProps<{ site: any }>()

// const { user } = useUserSession()

definePageMeta({
  title: 'Dashboards',
  subTitle: 'Organic Search',
  icon: 'i-heroicons-home',
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

const tabItems = [{ label: 'Top', icon: 'i-ph-chart-bar-duotone' }, { label: 'Trending', icon: 'i-ph-chart-line-up-duotone', filter: 'improving,with-clicks' }, { label: 'Declining', icon: 'i-ph-chart-line-down-duotone', filter: 'declining,with-clicks' }]
const tab = ref(0)
const currentTabLabel = computed(() => {
  return tabItems[tab.value].label
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
    <div class="grid grid-cols-3 gap-7  items-center justify-center">
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <CardGoogleSearchConsole :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      </UCard>
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <CardKeywords v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['keywords']" />
      </UCard>
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <CardWebIndexing v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['keywords']" />
      </UCard>
    </div>
    <div class="max-w-lg">
      <UTabs v-model="tab" :items="tabItems">
        <template #default="{ item }">
          <div class="flex items-center gap-2 relative truncate min-w-[150px] justify-center">
            <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">{{ item.label }}</span>
          </div>
        </template>
      </UTabs>
    </div>
    <div class="grid grid-cols-12 gap-7">
      <div class="col-span-8 space-y-5">
        <div>
          <div class="flex items-center mb-3 gap-3">
            <div class="text-sm font-bold">
              {{ currentTabLabel }} Pages
            </div>
            <NuxtLink :to="`/dashboard/site/${site.siteId}/pages`" class="text-[11px] hover:underline font-normal">
              View All
            </NuxtLink>
          </div>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <TablePagesNext :sort="tab === 0 ? undefined : { column: 'clicksPercent', direction: tab === 1 ? 'desc' : 'asc' }" :exclude-columns="['psiScore', 'actions']" :filter="currentTabFilter" :sortable="false" :pagination="false" :searchable="false" :expandable="false" :site="site" :filters="[]" :page-size="5" />
          </UCard>
        </div>
        <div>
          <div class="flex items-center mb-3 gap-3">
            <div class="text-sm font-bold">
              {{ currentTabLabel }} Keywords
            </div>
            <NuxtLink :to="`/dashboard/site/${site.siteId}/keywords`" class="text-[11px] hover:underline font-normal">
              View All
            </NuxtLink>
          </div>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <TableKeywordsNext :filter="currentTabFilter" :sort="tab === 0 ? undefined : { column: 'clicksPercent', direction: tab === 1 ? 'desc' : 'asc' }" :exclude-columns="['actions', 'position', 'actions', 'positionPercent', 'competitionIndex']" :sortable="false" :pagination="false" :searchable="false" :expandable="false" :site="site" :filters="[]" :page-size="5" />
          </UCard>
        </div>
      </div>
      <div class="col-span-4 space-y-5">
        <div>
          <div class="flex items-center mb-3 gap-3">
            <div class="text-sm font-bold">
              {{ currentTabLabel }} Countries
            </div>
            <NuxtLink :to="`/dashboard/site/${site.siteId}/countries`" class="text-[11px] hover:underline font-normal">
              View All
            </NuxtLink>
          </div>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <TableCountries :sort="tab === 0 ? undefined : { column: 'clicksPercent', direction: tab === 1 ? 'desc' : 'asc' }" :exclude-columns="['page', 'keyword', 'actions', 'impressions', 'impressionsPercent']" :filter="currentTabFilter" :sortable="false" :pagination="false" :searchable="false" :expandable="false" :site="site" :filters="[]" :page-size="5" />
          </UCard>
        </div>
        <div>
          <div class="flex items-center mb-3 gap-3">
            <div class="text-sm font-bold">
              Devices
            </div>
          </div>
          <UCard v-if="dates?.devices" :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <div class="grid grid-cols-2 gap-10 flex">
              <div class="h-[150px] flex flex-col justify-center items-center">
                <VisSingleContainer :data="Object.values(dates?.devices).filter(Boolean)" height="125">
                  <VisDonut :color="(d: number, i: number) => ['#f97316', '#3b82f6', '#ec4899'][i]" :value="(d: number) => d" radius="50" :arc-width="12" :corner-radius="12" :pad-angle="0.1" />
                </VisSingleContainer>
              </div>
              <div class="flex flex-col justify-center items-center">
                <div class="max-w-sm w-full grid grid-cols-2 gap-5">
                  <div v-for="(key, device) in dates?.devices">
                    <div class="flex items-center gap-1 text-sm">
                      <div v-if="device === 'mobileClicks'" class="bg-orange-500 rounded-full w-2 h-2" />
                      <div v-else-if="device === 'desktopClicks'" class="bg-blue-500 rounded-full w-2 h-2" />
                      <div v-else-if="device === 'tabletClicks'" class="bg-pink-500 rounded-full w-2 h-2" />
                      <span class="capitalize text-xs text-gray-500">{{ device.replace('Clicks', '') }}</span>
                    </div>
                    <div class="text-lg">
                      {{ useHumanFriendlyNumber(key / totalDeviceClicks * 100) }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

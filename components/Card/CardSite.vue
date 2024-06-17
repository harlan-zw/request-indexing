<script setup lang="ts">
import { useFriendlySiteUrl } from '~/composables/formatting'
import type { SiteSelect } from '~/server/database/schema'
import { useSiteData } from '~/composables/fetch'
import { useJobListener } from '~/composables/events'

const props = defineProps<{
  site: SiteSelect
  selectedCharts: string[]
}>()

const emits = defineEmits<{
  hide: []
}>()
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

function indexingPercentColor(perc: number) {
  if (perc >= 100)
    return 'text-gray-500'
  if (perc >= 90)
    return 'text-green-500'
  if (perc >= 50)
    return 'text-yellow-500'
  return 'text-red-500'
}

const gscDataSynced = ref(props.site.ingestingGsc)
const psiSynced = ref(props.site.ingestingPsi)
const sitemapSynced = ref(props.site.ingestingSitemap)
const isSynced = ref(props.site.isSynced)
useJobListener('gsc/date', (ctx) => {
  if (ctx.siteId === props.site.siteId) {
    gscDataSynced.value++
  }
})
useJobListener('gsc/device', (ctx) => {
  if (ctx.siteId === props.site.siteId) {
    gscDataSynced.value++
  }
})
useJobListener('gsc/page', (ctx) => {
  if (ctx.siteId === props.site.siteId) {
    gscDataSynced.value++
  }
})
useJobListener('gsc/query', (ctx) => {
  if (ctx.siteId === props.site.siteId) {
    gscDataSynced.value++
  }
})
useJobListener('gsc/all', (ctx) => {
  if (ctx.siteId === props.site.siteId) {
    gscDataSynced.value++
  }
})
useJobListener('gsc/country', (ctx) => {
  if (ctx.siteId === props.site.siteId) {
    gscDataSynced.value++
  }
})
useJobListener('paths/runPsi', (ctx) => {
  if (ctx.siteId === props.site.siteId) {
    psiSynced.value++
  }
})
useJobListener('sites/syncSitemapPages', (ctx) => {
  if (ctx.siteId === props.site.siteId) {
    sitemapSynced.value++
  }
})

const completedPercentSynced = computed(() => {
  return Math.round((gscDataSynced.value + psiSynced.value + sitemapSynced.value) / 366 * 100)
})

function hide() {
  emits('hide')
}

const dropdownItems = [
  [
    {
      label: 'View',
      icon: 'i-ph-link-simple-break-duotone',
      click: () => `/dashboard/site/${encodeURIComponent(props.site.siteId)}/overview`,
    },
    {
      label: 'Stop tracking',
      icon: 'i-ph-trash-duotone',
      click: hide,
    },
  ],
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/overview`" class="text-sm flex items-center gap-1 mb-3">
        <SiteFavicon :site="site" />
        <div>
          <h2 class="font-bold">
            {{ useFriendlySiteUrl(site.domain) }}
          </h2>
        </div>
      </NuxtLink>
      <div>
        <UDropdown :items="dropdownItems" :popper="{ offsetDistance: 0, placement: 'right-start' }">
          <UButton color="white" label="" variant="ghost" trailing-icon="i-ph-dots-three" />
        </UDropdown>
      </div>
    </div>
    <div class="flex gap-2 h-[190px] w-[400px]">
      <div v-if="!isSynced" class="flex w-full p-5">
        <div>
          <ProgressPercent :value="completedPercentSynced" class="text-sm mb-2 font-semibold text-gray-600">
            <div class="mb-2">
              {{ completedPercentSynced }}% - Syncing site data...
            </div>
          </ProgressPercent>
          <ul class="text-xs text-gray-500 space-y-2">
            <li class="flex items-center gap-1">
              <UIcon :name="gscDataSynced >= 366 ? `i-ph-check-fat-duotone` : `i-ph-spinner-gap-duotone`" :class="gscDataSynced < 366 ? 'animate-spin animated' : 'text-green-500'" class="w-4 h-4 opacity-80 text-gray-500 " />
              Ingesting Google Search Console data - {{ gscDataSynced }} / 366
            </li>
            <li class="flex items-center gap-1">
              <UIcon :name="psiSynced >= 2 ? `i-ph-check-fat-duotone` : `i-ph-spinner-gap-duotone`" :class="psiSynced < 2 ? 'animate-spin animated' : 'text-green-500'" class="w-4 h-4 opacity-80 text-gray-500 " />
              Testing top pages with PageSpeed Insights - {{ psiSynced }} / 2
            </li>
            <li class="flex items-center gap-1">
              <UIcon :name="sitemapSynced >= 1 ? `i-ph-check-fat-duotone` : `i-ph-spinner-gap-duotone`" :class="sitemapSynced < 1 ? 'animate-spin animated' : 'text-green-500'" class="w-4 h-4 opacity-80 text-gray-500" />
              Crawling indexable pages - {{ sitemapSynced }} / 1
            </li>
          </ul>
        </div>
      </div>
      <div v-else-if="!dates" class="h-full flex items-center justify-center w-full">
        <UIcon name="i-ph-spinner-gap-duotone" class="w-12 h-12 animate-spin" />
      </div>
      <template v-else>
        <div class="space-y-1 flex-grow w-full">
          <div class="border border-gray-500/20 shadow-sm rounded py-2">
            <CardGoogleSearchConsole :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="selectedCharts" />
          </div>
          <div class="flex justify-between">
            <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/pagespeed-insights`" class="transition rounded group hover:bg-gray-100 flex group text-[11px] items-center text-gray-500/80 gap-4 px-2">
              <div class="  py-1 rounded text-[11px] flex items-center gap-1 text-gray-500/80 ">
                <div class="flex gap-1">
                  <UIcon name="i-ph-device-mobile-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
                  <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
                    Mobile
                  </div>
                </div>
                <div class="flex items-center gap-1 font-bold" :class="formatPageSpeedInsightScore(dates?.psiData?.psiMobileScore)">
                  {{ useHumanFriendlyNumber(dates?.psiData?.psiMobileScore) }}
                </div>
              </div>

              <div class="  py-1 rounded text-[11px] flex items-center gap-1 text-gray-500/80 ">
                <div class="flex gap-1">
                  <UIcon name="i-ph-desktop-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
                  <div class="text-[11px] flex items-center text-gray-500/80">
                    Desktop
                  </div>
                </div>
                <div class="flex items-center font-bold" :class="formatPageSpeedInsightScore(dates?.psiData?.psiDesktopScore)">
                  {{ useHumanFriendlyNumber(dates?.psiData?.psiDesktopScore) }}
                </div>
              </div>
            </NuxtLink>
            <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/pagespeed-insights`" class="transition rounded group hover:bg-gray-100 flex group text-[11px] items-center text-gray-500/80 gap-1 px-2">
              <UTooltip v-for="(country, i) in dates.countries.slice(0, 3)" :key="i" :text="`#${(i + 1)} Clicks - ${country.country}`">
                <Icon :name="`circle-flags:${country.countryCode.toLowerCase()}`" class="w-3 h-3" />
              </UTooltip>
            </NuxtLink>
          </div>
        </div>
        <div class="flex flex-col h-full space-y-2 min-w-[75px]">
          <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/web-indexing`" class="transition group hover:bg-gray-50 rounded flex items-center">
            <UPopover mode="hover" :popper="{ placement: 'left' }">
              <div>
                <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
                  Indexed %
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-xl font-semibold" :class="indexingPercentColor(dates?.period.indexedPercent)">
                    {{ useHumanFriendlyNumber(dates?.period.indexedPercent) }}
                  </span>
                  <UIcon v-if="dates?.period.indexedPercent >= 50 && dates?.period.indexedPercent < 100" name="i-ph-info-duotone" class="w-4 h-4 text-yellow-500" />
                  <UIcon v-else-if="dates?.period.indexedPercent < 50" name="i-ph-warning-duotone" class="w-4 h-4 text-red-500" />
                </div>
              </div>
              <template #panel>
                <div class="p-4 text-sm">
                  <div>
                    <div class="text-gray-800 dark:text-gray-100 font-semibold mb-2">
                      {{ dates?.period.indexedPercent }}% Pages Indexed
                    </div>
                    <!--                  <div class="flex gap-3 justify-between mb-1"> -->
                    <!--                    <div class="text-gray-700 dark:text-gray-200"> -->
                    <!--                      Verdict -->
                    <!--                    </div> -->
                    <!--                    <div>{{ dates?.period.indexedPercent >= 50 ? 'Good' : 'Bad' }}</div> -->
                    <!--                  </div> -->
                    <div class="flex gap-3 justify-between mb-1">
                      <div class="text-gray-700 dark:text-gray-200">
                        Indexed Pages
                      </div>
                      <div>{{ dates?.period.indexedPagesCount }}</div>
                    </div>
                    <div class="flex gap-3 justify-between mb-1">
                      <div class="text-gray-700 dark:text-gray-200">
                        Total Pages
                      </div>
                      <div>{{ dates?.period.totalPagesCount }}</div>
                    </div>
                  </div>
                </div>
              </template>
            </UPopover>
          </NuxtLink>
          <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/pages`" class="transition group hover:bg-gray-50 rounded flex items-center">
            <div>
              <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
                Pages
              </div>
              <div class="flex items-center gap-1">
                <span class="text-xl font-semibold">
                  {{ useHumanFriendlyNumber(dates?.period.pages) }}
                </span>
                <TrendPercentage compact :value="dates?.period.pages" :prev-value="dates?.prevPeriod?.pages" />
              </div>
            </div>
          </NuxtLink>
          <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/keywords`" class="transition group hover:bg-gray-50 rounded flex items-center">
            <div>
              <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
                Keywords
              </div>
              <div class="flex items-center gap-1">
                <div class="text-xl font-semibold">
                  {{ useHumanFriendlyNumber(dates?.period.keywords) }}
                </div>
                <TrendPercentage compact :value="dates?.period?.keywords" :prev-value="dates?.prevPeriod?.keywords" />
              </div>
            </div>
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

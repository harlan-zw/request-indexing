<script setup lang="ts">
import { useFriendlySiteUrl } from '~/composables/formatting'
import type { SiteSelect } from '~/server/database/schema'
import { useSiteData } from '~/composables/fetch'
import { useJobListener } from '~/composables/events'

const props = defineProps<{
  site: SiteSelect
  selectedCharts: string[]
}>()

const siteData = useSiteData(props.site)
const { data: _dates } = siteData.dateAnalytics()

const dates = computed(() => {
  if (!_dates.value)
    return null
  const period = _dates.value.period
  const prevPeriod = _dates.value.prevPeriod
  return {
    dates: _dates.value.dates,
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

const gscDataSynced = ref(60 - props.site.ingestingGsc)
const psiSynced = ref(2 - props.site.ingestingPsi)
const sitemapSynced = ref(1 - props.site.ingestingSitemap)
const isSynced = ref(props.site.isSynced)
useJobListener('sites/syncGscDate', (ctx) => {
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
</script>

<template>
  <div>
    <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/overview`" class="text-sm flex items-center gap-1 mb-3">
      <SiteFavicon :site="site" />
      <div>
        <h2 class="font-bold">
          {{ useFriendlySiteUrl(site.domain) }}
        </h2>
      </div>
    </NuxtLink>
    <div class="grid grid-cols-4 gap-3 border border-gray-500/20 shadow-sm rounded h-[174px] w-[475px]">
      <div v-if="!isSynced" class="flex w-full col-span-4 p-5">
        <div>
          <div class="text-sm flex items-center mb-2 font-semibold text-gray-600">
            Syncing site data...
          </div>
          <ul class="text-xs text-gray-500 space-y-2">
            <li class="flex items-center gap-1">
              <UIcon :name="gscDataSynced >= 60 ? `i-ph-check-fat-duotone` : `i-ph-spinner-gap-duotone`" :class="gscDataSynced < 60 ? 'animate-spin animated' : 'text-green-500'" class="w-4 h-4 opacity-80 text-gray-500 " />
              Ingesting Google Search Console data - {{ gscDataSynced }} / 60
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
        <div class="flex flex-col h-full">
          <UPopover mode="hover" :popper="{ placement: 'left' }">
            <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/web-indexing`" class="transition group hover:bg-gray-50 rounded flex items-center h-1/3 px-2">
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
            </NuxtLink>
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
          <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/pages`" class="transition group hover:bg-gray-50 rounded flex items-center h-1/3 px-2">
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
          <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/keywords`" class="transition group hover:bg-gray-50 rounded flex items-center h-1/3 px-2">
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
        <CardGoogleSearchConsole :key="site.siteId" class="col-span-2" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="selectedCharts" />
        <CardPageSpeedInsights :key="site.siteId" :site="site" :selected-charts="selectedCharts" />
      </template>
    </div>
  </div>
</template>

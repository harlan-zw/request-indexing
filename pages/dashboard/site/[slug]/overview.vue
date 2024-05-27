<script lang="ts" setup>
import { useHumanFriendlyNumber } from '~/composables/formatting'
import { useSiteData } from '~/composables/fetch'
import CardTopCountries from '~/components/Card/CardTopCountries.vue'

const props = defineProps<{ site: any }>()

// const { user } = useUserSession()

definePageMeta({
  title: 'Overview',
  icon: 'i-heroicons-home',
})

const siteData = useSiteData(props.site)
// const { data: dates } = siteData.dates()
const { data: pages } = siteData.pages({
  query: {
    rowLimit: 5,
  },
})
// const { data: analytics } = siteData.analytics()
const { data: devices } = siteData.devices()
const { data: countries } = siteData.countries()
const { data: dates } = siteData.dateAnalytics()
//
// const topTrafficPages = computed(() => {
//   if (!pages?.value?.rows)
//     return []
//   return pages.value.rows.sort((a, b) => b.clicks - a.clicks).slice(0, 5)
// })
// 1. Trending Content: Identify content that is gaining popularity or showing significant improvement in performance.
// 2. Top Performing Pages: List the top 5 pages with the most clicks or highest growth in traffic.
// 3. Top Queries: Show the top 5 search queries driving traffic to the site.
// const trendingContent = computed(() => {
//   if (!pages?.value?.rows)
//     return []
//   // we figure out the % change in clicks and only return top % change
//   const rows = pages.value.rows
//     .filter(row => row.prevClicks > 10) // avoid showing pages with very low clicks
//     .map((row) => {
//       const prev = Number(row.prevClicks)
//       const current = Number(row.clicks)
//       const percent = prev === 0 ? 0 : (current - prev) / ((prev + current) / 2) * 100
//       return {
//         ...row,
//         percent,
//       }
//     })
//     .filter(row => row.percent > 0)
//   return rows.sort((a, b) => b.percent - a.percent).slice(0, 5)
// })

function pageUrlToPath(url: string) {
  try {
    return new URL(url).pathname
  }
  catch {
    return url
  }
}

const filters = [
  {
    key: 'top',
    label: 'Top Traffic',
    filter: (rows: T[]) => {
      return rows.sort((a, b) => b.clicks - a.clicks)
    },
  },
  {
    key: 'trending',
    label: 'Trending',
    filter: (rows: T[]) => {
      // we figure out the % change in clicks and only return top % change
      return rows
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
        .sort((a, b) => b.percent - a.percent)
    },
  },
  {
    key: 'new',
    label: 'New & Lost',
    filter: (rows: T[]) => {
      return rows.filter(row => !row.prevImpressions || row.lost)
    },
  },
]
</script>

<template>
  <div>
    <div class="grid grid-cols-12 gap-14 ">
      <div class="space-y-10 col-span-8">
        <CardGoogleSearchConsole v-if="dates" :key="site.siteId" fill :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
        <div>
          <TableData :searchable="false" :filters="filters" :value="pages?.rows || []" :columns="[{ key: 'page', label: 'Page' }, { key: 'keyword', label: 'Top Keyword' }, { key: 'clicks', label: 'Clicks' }]">
            <template #header>
              <div class="font-bold flex items-center justify-between gap-2">
                <div>
                  Pages
                  <NuxtLink :to="`/dashboard/site/${site.siteId}/pages`" class="underline text-sm font-normal ml-3">
                    View All
                  </NuxtLink>
                </div>
              </div>
            </template>
            <template #page-data="{ row }">
              <div class="flex items-center">
                <div class="relative group w-[260px] max-w-full">
                  <div class="flex items-center gap-2">
                    <NuxtLink :title="`Open ${row.page}`" class="max-w-[260px] text-xs" target="_blank" color="gray">
                      <div class="max-w-[260px] truncate text-ellipsis">
                        {{ pageUrlToPath(row.page) }}
                      </div>
                    </NuxtLink>
                    <UBadge v-if="!row.prevImpressions" size="xs" variant="subtle">
                      <span class="text-[10px]">New</span>
                    </UBadge>
                    <UBadge v-else-if="row.lost" size="xs" color="red" variant="subtle">
                      <span class="text-[10px]">Lost</span>
                    </UBadge>
                  </div>
                  <UTooltip :text="`${Math.round((row.clicks / dates?.period.clicks) * 100)}% of clicks`" class="w-full block">
                    <UProgress :value="Math.round((row.clicks / dates?.period.clicks) * 100)" color="blue" size="xs" class="opacity-75 group-hover:opacity-100 transition py-1" />
                  </UTooltip>
                </div>
              </div>
            </template>
            <template #clicks-data="{ row }">
              <div class="flex items-center gap-1">
                <UTooltip :text="`${row.clicks} estimated clicks`">
                  <IconClicks />
                </UTooltip>
                <div>{{ useHumanFriendlyNumber(row.clicks) }}</div>
                <TrendPercentage :value="row.clicks" :prev-value="row.prevClicks" />
              </div>
            </template>
            <template #keyword-data="{ row }">
              <div class="flex items-center gap-1">
                <PositionMetric :value="row.keywordPosition" />
                <UTooltip :text="row.keyword">
                  <div class="truncate max-w-[200px] text-xs">
                    {{ row.keyword }}
                  </div>
                </UTooltip>
              </div>
            </template>
          </TableData>
        </div>
      </div>
      <div class="col-span-4 space-y-5">
        <CardTopCountries v-if="countries" :countries="countries" />
        <CardDevices v-if="devices" :devices="devices" />
      </div>
    </div>
  </div>
</template>

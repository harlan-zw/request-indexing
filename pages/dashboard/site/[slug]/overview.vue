<script lang="ts" setup>
import { useHumanFriendlyNumber } from '../../../../composables/formatting'
import { useSiteData } from '~/composables/fetch'
import CardTopCountries from '~/components/Card/CardTopCountries.vue'

const props = defineProps<{ data: any, site: any }>()

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
    <!--    <UPageHeader :headline="useFriendlySiteUrl(site.domain)"> -->
    <!--      <template #title> -->
    <!--        <div class="flex items-center gap-3"> -->
    <!--          <UIcon :name="$route.meta.icon" /> -->
    <!--          {{ $route.meta.title }} -->
    <!--        </div> -->
    <!--      </template> -->
    <!--      <template #links> -->
    <!--        <div v-if="analytics" class="lg:flex items-center justify-center gap-10 hidden "> -->
    <!--          <div class="flex flex-col justify-center"> -->
    <!--            <span class="text-sm opacity-70">Clicks</span> -->
    <!--            <div class="text-xl flex items-end gap-2"> -->
    <!--              <span>{{ useHumanFriendlyNumber(analytics.period.clicks) }}</span> -->
    <!--              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="w-5 h-5 opacity-80"><path fill="#888888" d="m11.5 11l6.38 5.37l-.88.18l-.64.12c-.63.13-.99.83-.71 1.4l.27.58l1.36 2.94l-1.42.66l-1.36-2.93l-.26-.58a.985.985 0 0 0-1.52-.36l-.51.4l-.71.57zm-.74-2.31a.76.76 0 0 0-.76.76V20.9c0 .42.34.76.76.76c.19 0 .35-.06.48-.16l1.91-1.55l1.66 3.62c.13.27.4.43.69.43c.11 0 .22 0 .33-.08l2.76-1.28c.38-.18.56-.64.36-1.01L17.28 18l2.41-.45a.88.88 0 0 0 .43-.26c.27-.32.23-.79-.12-1.08l-8.74-7.35l-.01.01a.756.756 0 0 0-.49-.18M15 10V8h5v2zm-1.17-5.24l2.83-2.83l1.41 1.41l-2.83 2.83zM10 0h2v5h-2zM3.93 14.66l2.83-2.83l1.41 1.41l-2.83 2.83zm0-11.32l1.41-1.41l2.83 2.83l-1.41 1.41zM7 10H2V8h5z" /></svg> -->
    <!--            </div> -->
    <!--            <TrendPercentage v-if="user.analyticsPeriod !== 'all'" :value="analytics.period.clicks" :prev-value="analytics.prevPeriod.clicks" /> -->
    <!--          </div> -->
    <!--          <div class="flex flex-col justify-center"> -->
    <!--            <span class="text-sm opacity-70">Impressions</span> -->
    <!--            <div class="text-xl flex items-end gap-2"> -->
    <!--              <span>{{ useHumanFriendlyNumber(analytics.period.impressions) }}</span> -->
    <!--              <svg xmlns="http://www.w3.org/2000/svg" width="0" height="24" viewBox="0 0 32 32" class="w-5 h-5 opacity-80"><path fill="#888888" d="M30.94 15.66A16.69 16.69 0 0 0 16 5A16.69 16.69 0 0 0 1.06 15.66a1 1 0 0 0 0 .68A16.69 16.69 0 0 0 16 27a16.69 16.69 0 0 0 14.94-10.66a1 1 0 0 0 0-.68ZM16 25c-5.3 0-10.9-3.93-12.93-9C5.1 10.93 10.7 7 16 7s10.9 3.93 12.93 9C26.9 21.07 21.3 25 16 25Z" /><path fill="#888888" d="M16 10a6 6 0 1 0 6 6a6 6 0 0 0-6-6Zm0 10a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" /></svg> -->
    <!--            </div> -->
    <!--            <TrendPercentage v-if="user.analyticsPeriod !== 'all'" :value="analytics.period.impressions" :prev-value="analytics.prevPeriod.impressions" /> -->
    <!--          </div> -->
    <!--        </div> -->
    <!--      </template> -->
    <!--    </UPageHeader> -->
    <!--    <UPageBody> -->
    <div />

    <div class="grid grid-cols-12 gap-14 ">
      <div class="space-y-10 col-span-8">
        <CardGoogleSearchConsole v-if="dates" :key="site.siteId" fill :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" @toggle-chart="toggleChart" />
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

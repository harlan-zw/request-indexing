<script lang="ts" setup>
defineProps<{ site: any }>()

// const { user } = useUserSession()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Keyword Insights',
  icon: 'i-ph-lightning-duotone',
})

// const siteData = useSiteData(props.site)
// // const { data: dates } = siteData.dates()
// const { data: pages } = siteData.pages({
//   query: {
//     rowLimit: 5,
//   },
// })
// // const { data: analytics } = siteData.analytics()
// const { data: devices } = siteData.devices()
// const { data: countries } = siteData.countries()
// const { data: dates } = siteData.dateAnalytics()
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

// function pageUrlToPath(url: string) {
//   try {
//     return new URL(url).pathname
//   }
//   catch {
//     return url
//   }
// }
//
// const filters = [
//   {
//     key: 'top',
//     label: 'Top Traffic',
//     filter: (rows: T[]) => {
//       return rows.sort((a, b) => b.clicks - a.clicks)
//     },
//   },
//   {
//     key: 'trending',
//     label: 'Trending',
//     filter: (rows: T[]) => {
//       // we figure out the % change in clicks and only return top % change
//       return rows
//         .filter(row => row.prevClicks > 10) // avoid showing pages with very low clicks
//         .map((row) => {
//           const prev = Number(row.prevClicks)
//           const current = Number(row.clicks)
//           const percent = prev === 0 ? 0 : (current - prev) / ((prev + current) / 2) * 100
//           return {
//             ...row,
//             percent,
//           }
//         })
//         .filter(row => row.percent > 0)
//         .sort((a, b) => b.percent - a.percent)
//     },
//   },
//   {
//     key: 'new',
//     label: 'New & Lost',
//     filter: (rows: T[]) => {
//       return rows.filter(row => !row.prevImpressions || row.lost)
//     },
//   },
// ]
</script>

<template>
<div class="grid grid-cols-3 w-full gap-10">
  <div class="col-span-2 space-y-10">
    <div class="space-y-10">
      <div>
        <CardTitle>
          Long-tail keywords
        </CardTitle>
        <UCard>
          <TableKeywordSearchVolume :exclude-columns="['lastSynced']" :site="site" filter="long-tail" :filters="false" :sort="{ column: 'currentMonthSearchVolume', direction: 'desc' }" :searchable="false" :page-size="6" />
        </UCard>
      </div>
      <div>
        <CardTitle>
          Long-tail keywords
        </CardTitle>
      </div>
      <UCard>
      </UCard>
    </div>
  </div>
  <div class="col-span-1 space-y-7">
    <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
      <h2 class="mb-2 flex items-center text-sm font-semibold">
        <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
        How it works
      </h2>
      <div class="text-sm text-gray-500 mb-Z1">
        Every day your top pages will be scanned with the PageSpeed Insights API and the results will appear here.
      </div>
    </UCard>
    <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
      <h2 class="mb-2 flex items-center text-sm font-semibold">
        <UIcon name="i-ph-caret-double-right-duotone" class="w-5 h-5 mr-1 text-gray-500" />
        Track keyword
      </h2>
      <div class="text-sm text-gray-500">
        Monitor individual keywords for search volume, competition, and more.
      </div>
      <UForm class="flex items-end gap-3">
        <UFormGroup label="Keyword" class="mt-3 grow">
          <UInput />
        </UFormGroup>
        <div>
          <UButton type="submit" size="sm" color="gray">
            Track
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</div>
</template>

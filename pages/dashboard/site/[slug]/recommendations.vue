<script lang="ts" setup>
defineProps<{ site: any }>()

// const { user } = useUserSession()

definePageMeta({
  title: 'Recommendations',
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
  <div>
    <div class="grid grid-cols-12 gap-14 ">
      <div class="space-y-10 col-span-8">
        <div>
          <UCard>
            <template #header>
              <div class="font-bold flex items-center justify-between gap-2">
                <div>
                  Long-tail keywords
                </div>
              </div>
            </template>
          </UCard>
        </div>
        <UCard>
          <template #header>
            <div class="font-bold flex items-center justify-between gap-2">
              <div>
                Content gap
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>

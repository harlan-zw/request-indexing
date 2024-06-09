<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Keywords',
  icon: 'i-heroicons-magnifying-glass-circle',
})

const keyword = useRoute().params.keyword

onMounted(async () => {
  // res.value = await $fetch(`/api/sites/${props.site.siteId}/keywords/${encodeURIComponent(keyword as string)}`)
})

const siteData = useSiteData(props.site)
const { data: dates } = siteData.keywordDateAnalytics({
  query: {
    filter: `keyword:${keyword}`,
  },
})

const router = useRouter()
function changeKeyword(value: string) {
  router.push(`/dashboard/site/${props.site.siteId}/keywords/${encodeURIComponent(value.value)}`)
}
//
// const keywordGraphData = computed(() => {
//   if (!dates.value?.history?.results?.[0]) {
//     return []
//   }
//   return dates.value?.history.results[0].keyword_metrics.monthly_search_volumes.map((val) => {
//     // need to convert to real dates in the format yyyy-mm-dd
//     const monthTextToNumber = {
//       JANUARY: '01',
//       FEBRUARY: '02',
//       MARCH: '03',
//       APRIL: '04',
//       MAY: '05',
//       JUNE: '06',
//       JULY: '07',
//       AUGUST: '08',
//       SEPTEMBER: '09',
//       OCTOBER: '10',
//       NOVEMBER: '11',
//       DECEMBER: '12',
//     }
//     const month = monthTextToNumber[val.month]
//     return {
//       date: `${val.year}-${month}-01`,
//       monthly_searches: val.monthly_searches,
//     }
//   })
// })
//
// const ideas = computed(() => {
//   return (dates.value?.ideas || []).map(row => {
//     return {
//       ...row,
//       avg_monthly_searches: row.keyword_idea_metrics?.avg_monthly_searches,
//       competition: row.keyword_idea_metrics?.competition,
//       competition_index: row.keyword_idea_metrics?.competition_index,
//       average_cpc_micros: row.keyword_idea_metrics?.average_cpc_micros / 1000000,
//     }
//   })
// })
const currentKeywordData = computed(() => {
  return (dates.value?.ideas || []).find(row => row.keyword === keyword)
})
</script>

<template>
  <div>
    <USelectMenu class="mb-6" searchable :model-value="keyword" variant="none" :options="[{ label: keyword, value: keyword }]" @change="changeKeyword">
      <template #option="{ option }">
        <div class="flex w-full items-center">
          <div class="flex items-center gap-2">
            <span class="truncate">{{ useFriendlySiteUrl(option.value) }}</span>
          </div>
        </div>
      </template>
      <template #default="{ open }">
        <UButton color="white" variant="ghost" size="xl" class="flex items-center gap-1" :ui="{ padding: { xl: 'pl-0 ' } }">
          <UIcon name="i-heroicons-chevron-right-20-solid" class="w-5 h-5 transition-transform text-gray-400 dark:text-gray-500" :class="[open && 'transform rotate-90']" />
          <h2 class="text-xl font-semibold">
            {{ keyword }}
          </h2>
        </UButton>
      </template>
    </USelectMenu>
    <h2>Google Ads</h2>
    <div class="grid grid-cols-3 w-full gap-10 mb-10">
      <UCard v-if="currentKeywordData">
        <div>{{ currentKeywordData.competition }} competition</div>
        <div>{{ currentKeywordData.avgMonthlySearches }} avg. monthly searches</div>
        <GraphData :value="currentKeywordData.monthlySearchVolumes" :columns="['value']" @tooltip="e => tooltipData = e" />
      </UCard>
      <UCard class="col-span-2">
        <TableKeywordSearchVolume :site="site" :searchable="false" :filter="`related:${keyword}`" :page-size="5" />
      </UCard>
    </div>
    <h2>Google Search Console</h2>
    <div class="grid grid-cols-3 w-full gap-10 mb-10">
      <UCard>
        <CardGoogleSearchConsole v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      </UCard>
      <UCard>
        <CardKeywords v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      </UCard>
    </div>
    <UCard>
      <TableKeywordPagesNext :site="site" :filter="`keyword:${keyword}`" />
    </UCard>
  </div>
</template>

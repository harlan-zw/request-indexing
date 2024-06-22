<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Pages',
  icon: 'i-heroicons-folder',
})
const siteData = useSiteData(props.site)
const { data: dates } = siteData.dateAnalytics()

const graph = computed(() => {
  if (!dates.value?.dates)
    return []
  return dates.value.dates.map((d: any, index) => ({
    date: d.date,
    // pages is the max of the current 0-index
    pages: Math.max(d.pages, dates.value.dates.slice(0, index).reduce((acc: number, curr: any) => Math.max(acc, curr.pages), 0)),
  }))
})

const tooltipData = ref()
const tooltipEntry = computed(() => {
  if (!tooltipData.value?.time)
    return null
  // find graph with the date = time
  return graph.value.find(row => row.date === tooltipData.value.time)
})

const buttons = computed(() => [
  {
    label: 'Pages',
    key: 'pages',
    value: tooltipEntry.value?.pages || graph.value[graph.value.length - 1]?.pages,
  },
])
</script>

<template>
<div class="space-y-7">
    <div class="flex items-center gap-3">
      <div class="border border-dashed rounded-lg">
        <CalenderFilter />
      </div>
      <div class="border border-dashed rounded-lg">
        <LocationFilter />
      </div>
    </div>
      <CardGoogleSearchConsole v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      <TablePagesNext :site="site" :page-size="12" :exclude-columns="['psiScore']" />
  <!--      <div> -->
  <!--        <div class="text-2xl font-bold flex gap-2 items-center"> -->
  <!--          {{ useHumanFriendlyNumber(pages.periodCount) }}  <span class="font-normal text-sm">Pages</span> -->
  <!--        </div> -->
  <!--        <TrendPercentage :value="pages.periodCount" :prev-value="pages.prevPeriodCount" /> -->
  <!--      </div> -->
  <!--      <div class="grid grid-cols-4"> -->
  <!-- &lt;!&ndash;        <TablePages class="col-span-3" :value="pages?.rows" :site="site" />&ndash;&gt; -->
  <!--      </div> -->
  <!--      <div v-if="pagesDb" class="grid grid-cols-4"> -->
  <!--        <TablePagesNext class="col-span-3" :value="pagesDb?.rows" :site="site" /> -->
  <!--      </div> -->
  </div>
</template>

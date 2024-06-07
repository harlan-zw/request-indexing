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
  <div>
    <div class="grid grid-cols-3 w-full gap-10 mb-10">
      <UCard>
        <CardGoogleSearchConsole v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      </UCard>
      <UCard>
        <div class="flex flex-col justify-center">
          <GraphButtonGroup :buttons="buttons" :model-value="['pages']" class="px-2">
            <template #pages-icon>
              <IconClicks class="w-4 h-4 opacity-80" />
            </template>
            <template #pages-trend>
              <!--            <TrendPercentage v-if="!tooltipData && period" compact :value="period.clicks" :prev-value="prevPeriod?.clicks" /> -->
            </template>
          </GraphButtonGroup>
          <GraphData :value="graph!" :columns="['pages']" @tooltip="e => tooltipData = e" />
        </div>
      </UCard>
    </div>
    <UCard>
      <TablePagesNext :site="site" :page-size="12" />
    </UCard>
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

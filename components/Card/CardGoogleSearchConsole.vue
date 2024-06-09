<script lang="ts" setup>
import type { SiteDateAnalyticsSelect, SiteSelect } from '~/server/database/schema'
import type { GraphButton } from '~/components/GraphButtonGroup.vue'

const props = defineProps<{
  site: SiteSelect
  selectedCharts: string[]
  dates: SiteDateAnalyticsSelect[]
  period: SiteDateAnalyticsSelect
  prevPeriod: SiteDateAnalyticsSelect
  fill?: boolean
}>()
//
// const emits = defineEmits<{
//   toggleChart: [chart: string]
// }>()
//
// const { site } = toRefs(props)

// const siteData = useSiteData(props.site)
// const { data: analytics } = siteData.analytics()

const graph = computed(
  () => (props.dates || []).map(row => ({
    ...row,
    ctr: (row.ctr || 0) * 100,
  })),
)

const tooltipData = ref()
const tooltipEntry = computed(() => {
  if (!tooltipData.value?.time)
    return null
  // find graph with the date = time
  return graph.value.find(row => row.date === tooltipData.value.time)
})

// function toggleChart(chart: string) {
//   emits('toggleChart', chart)
// }

// const expanded = ref(false)
// const indexedPercent = computed(() => {
//   return Math.round(props.site.pageCountIndexed / props.site.pageCount * 100)
// })
const graphColours = {
  clicks: {
    topColor: 'rgba(33, 150, 243, 0.9)',
    bottomColor: 'rgba(33, 150, 243, 0.04)',
    lineColor: 'rgba(33, 150, 243, 0.5)',
  },
  impressions: {
    topColor: 'rgba(156, 39, 176, 0.4)',
    bottomColor: 'rgba(156, 39, 176, 0.04)',
    lineColor: 'rgba(156, 39, 176, 0.5)',
  },
  position: {
    topColor: 'rgba(255, 152, 0, 0.3)',
    bottomColor: 'rgba(255, 152, 0, 0.04)',
    lineColor: 'rgba(255, 152, 0, 0.4)',
  },
}

const buttons = computed<GraphButton[]>(() => [
  {
    key: 'clicks',
    label: 'Clicks',
    value: typeof tooltipEntry.value?.clicks !== 'undefined' ? tooltipEntry.value.clicks : props.period?.clicks,
    color: 'blue',
  },
  {
    key: 'impressions',
    label: 'Views',
    value: typeof tooltipEntry.value?.impressions !== 'undefined' ? tooltipEntry.value.impressions : props.period?.impressions,
    color: 'purple',
  },
  {
    key: 'position',
    label: 'Position',
    value: typeof tooltipEntry.value?.position !== 'undefined' ? tooltipEntry.value.position : props.period?.position,
    color: 'orange',
  },
])
</script>

<template>
  <div class="flex flex-col justify-center">
    <GraphButtonGroup :buttons="buttons" :model-value="selectedCharts" class="px-2">
      <template #clicks-icon>
        <IconClicks class="w-4 h-4 opacity-80" />
      </template>
      <template #clicks-trend>
        <TrendPercentage v-if="!tooltipData && period" compact :value="period.clicks" :prev-value="prevPeriod?.clicks" />
      </template>
      <template #impressions-icon>
        <IconImpressions class="w-4 h-4 opacity-80" />
      </template>
      <template #impressions-trend>
        <TrendPercentage v-if="!tooltipData && period" compact :value="period.impressions" :prev-value="prevPeriod?.impressions" />
      </template>
      <template #position-icon>
        <IconPosition class="w-4 h-4 opacity-80" />
      </template>
      <template #position-trend>
        <TrendPercentage v-if="!tooltipData && period" compact negative :value="period.position" :prev-value="prevPeriod?.position" />
      </template>
    </GraphButtonGroup>
    <!--    <GraphData :height="fill ? 300 : 100" :value="graph!" :columns="selectedCharts" :colors="graphColours" @tooltip="e => tooltipData = e" /> -->
    <GraphDataNext :height="fill ? 300 : 100" :value="graph!" :columns="selectedCharts" :colors="graphColours" @tooltip="e => tooltipData = e" />
  </div>
</template>

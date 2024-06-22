<script lang="ts" setup>
import type { SiteDateAnalyticsSelect, SiteSelect } from '~/server/database/schema'
import type { GraphButton } from '~/components/GraphButtonGroup.vue'
import { googleSearchConsoleColumns } from '~/composables/state'

const props = defineProps<{
  site: SiteSelect
  dates: SiteDateAnalyticsSelect[]
  period: SiteDateAnalyticsSelect
  prevPeriod: SiteDateAnalyticsSelect
  fill?: boolean
}>()

defineEmits<{
  'update:model-value': [key: string]
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
  () => (props.dates || []).map((row) => {
    // we need to make the clicks and impressions into percentages based on the totals
    const clicks = row.clicks || 0
    const impressions = row.impressions || 0
    return {
      ...row,
      clicksRelative: (clicks / props.period.clicks) * 33, // 1/2 the %
      impressionsRelative: (impressions / props.period.impressions) * 100,
      ctrRelative: (clicks / impressions) * 100,
    }
    // return {
    //   ...row,
    //   ctr: (row.ctr || 0) * 100,
    // }
  }),
)

const tooltipData = ref()

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
    value: typeof tooltipData.value?.clicks !== 'undefined' ? tooltipData.value.clicks : props.period?.clicks,
    color: 'blue',
  },
  {
    key: 'impressions',
    label: 'Views',
    value: typeof tooltipData.value?.impressions !== 'undefined' ? tooltipData.value.impressions : props.period?.impressions,
    color: 'purple',
  },
  {
    key: 'position',
    label: 'Position',
    value: typeof tooltipData.value?.position !== 'undefined' ? tooltipData.value.position : props.period?.position,
    color: 'orange',
  },
])
</script>

<template>
  <div class="flex flex-col justify-center">
    <GraphButtonGroup v-model="googleSearchConsoleColumns" :buttons="buttons" class="mb-2">
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
    <!--    <GraphData v-if="site.domain !== 'https://nuxtseo.com'" :height="fill ? 300 : 100" :value="graph!" :columns="selectedCharts" :colors="graphColours" @tooltip="e => tooltipData = e" /> -->
    <GraphDataNext v-if="googleSearchConsoleColumns.length" :height="fill ? 300 : 100" :value="graph!" :columns="googleSearchConsoleColumns" :colors="graphColours" @tooltip="e => tooltipData = e" />
  </div>
</template>

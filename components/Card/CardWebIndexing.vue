<script lang="ts" setup>
import type { SiteDateAnalyticsSelect, SiteSelect } from '~/server/database/schema'

const props = defineProps<{
  site: SiteSelect
  selectedCharts: string[]
  dates: SiteDateAnalyticsSelect[]
  period: SiteDateAnalyticsSelect
  prevPeriod: SiteDateAnalyticsSelect
}>()

// const emits = defineEmits<{
//   toggleChart: [chart: string]
// }>()

const highestTotalPagesCount = props.dates.reduce((acc, row) => Math.max(acc, row.totalPagesCount), 0)

const graph = computed(
  () => (props.dates || []).map(((row, i) => {
    return {
      date: row.date,
      indexedPagesCount: row.indexedPagesCount,
      indexedPercent: Math.round(row.indexedPagesCount / (highestTotalPagesCount || 1) * 100),
      totalPagesCount: row.totalPagesCount,
    }
  })),
)

const lastEntry = computed(() => {
  if (!graph?.value?.length) {
    return {
      totalPagesCount: 0,
      indexedPagesCount: 0,
      indexedPercent: 0,
    }
  }
  return graph.value[graph.value.length - 1]
})

const buttons = computed(() => [
  {
    key: 'indexedPagesCount',
    icon: 'i-ph-list-magnifying-glass',
    label: 'Pages',
    value: lastEntry.value?.indexedPagesCount,
    color: 'blue',
  },
  {
    key: 'indexedPercent',
    icon: 'i-carbon-bot',
    label: 'Indexed %',
    value: lastEntry.value?.indexedPercent,
    color: 'orange',
  },
])

// const columns = [
//   'indexedPagesCount',
//   {
//     key: 'indexedPercent',
//     type: 'line',
//     priceScaleId: 'left',
//     priceFormat: {
//       type: 'percent',
//     },
//   },
// ]

// const graphColours = {
//   indexedPagesCount: {
//     // indigo
//     topColor: 'rgba(63, 81, 181, 0.9)',
//     bottomColor: 'rgba(63, 81, 181, 0.04)',
//     lineColor: 'rgba(63, 81, 181, 0.5)',
//   },
//   indexedPercent: {
//     // orange
//     topColor: 'rgba(255, 152, 0, 0.9)',
//     bottomColor: 'rgba(255, 152, 0, 0.04)',
//     lineColor: 'rgba(255, 152, 0, 0.5)',
//   },
// }
</script>

<template>
  <div class="flex flex-col">
    <GraphButtonGroup :buttons="buttons" :model-value="selectedCharts">
      <template #indexedPagesCount-trend>
        <TrendPercentage :value="lastEntry?.indexedPagesCount" :prev-value="props.prevPeriod?.indexedPagesCount" />
      </template>
    </GraphButtonGroup>
    <div class="relative">
      <GraphPercent :value="graph!.map(g => ({ time: g.date, value: g.indexedPagesCount }))" />
    </div>
  </div>
</template>

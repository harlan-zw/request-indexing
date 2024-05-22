<script lang="ts" setup>
import type { SiteDateAnalyticsSelect, SiteSelect } from '~/server/database/schema'

const props = defineProps<{
  site: SiteSelect
  selectedCharts: string[]
  dates: SiteDateAnalyticsSelect[]
  period: SiteDateAnalyticsSelect
  prevPeriod: SiteDateAnalyticsSelect
}>()

const emits = defineEmits<{
  toggleChart: [chart: string]
}>()

const graph = computed(
  () => (props.dates || []).map(((row, i) => {
    // need to compute indexedPagesCount, it should be the MAX of all of the previous row pages count
    const indexedPagesCount = props.dates.slice(0, i)
      .reduce((acc, row) => Math.max(acc, row.pages), 0)
    return {
      indexedPagesCount,
      indexedPercent: Math.round(indexedPagesCount / (row.totalPagesCount || 1) * 100),
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

const columns = [
  'indexedPagesCount',
  {
    key: 'indexedPercent',
    type: 'line',
    priceScaleId: 'left',
    priceFormat: {
      type: 'percent',
    },
  },
]
</script>

<template>
  <div class="flex flex-col">
    <GraphButtonGroup :buttons="buttons" :model-value="selectedCharts" @update:model-value="e => $emit('toggleChart', e)">
      <template #indexedPagesCount-trend>
        <TrendPercentage :value="lastEntry?.indexedPagesCount" :prev-value="props.prevPeriod?.indexedPagesCount" />
      </template>
    </GraphButtonGroup>
  </div>
</template>

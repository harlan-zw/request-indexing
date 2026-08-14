<script lang="ts" setup>
import type { GraphButton } from '~~/layers/design-system/components/chart/GraphButtonGroup.vue'
import type { SiteDateAnalyticsSelect, SiteSelect } from '#shared/types/database'

const props = defineProps<{
  site: SiteSelect
  dates: SiteDateAnalyticsSelect[]
  period: SiteDateAnalyticsSelect
  prevPeriod: SiteDateAnalyticsSelect
  graphless: boolean
}>()

const graph = computed(
  () => (props.dates || []).map((d) => {
    return {
      ...d,
      ctr: (d.ctr ?? 0) * 100,
    }
  }),
)

// const lastEntry = computed(() => {
//   if (!props.dates?.length)
//     return null
//   return props.dates[props.dates.length - 1]
// })

const tooltipData = ref()
const tooltipEntry = computed(() => {
  if (!tooltipData.value?.time)
    return null
  // find graph with the date = time
  return graph.value.find(row => row.date === tooltipData.value.time)
})

const graphColours = { keywords: 'rgba(63, 81, 181, 0.5)' }

const buttons = computed<GraphButton[]>(() => [
  {
    key: 'keywords',
    label: 'Keywords',
    value: tooltipEntry.value?.keywords ?? props.period?.keywords ?? 0,
    color: 'blue',
  },
])

const selectedCharts = ref(['keywords', 'ctr'])

function toggleChart(charts: string[]) {
  selectedCharts.value = charts
}
</script>

<template>
  <div class="transition group">
    <GraphButtonGroup :buttons="buttons" :model-value="selectedCharts" @update:model-value="toggleChart">
      <template #keywords-icon>
        <UIcon name="i-ph-list-magnifying-glass" class="w-4 h-4 opacity-80" />
      </template>
      <template #keywords-trend>
        <TrendPercentage compact :value="period?.keywords ?? 0" :prev-value="prevPeriod?.keywords ?? 0" />
      </template>
      <template #ctr-trend>
        <TrendPercentage compact :value="period?.ctr ?? 0" :prev-value="prevPeriod?.ctr ?? 0" />
      </template>
      <template #ctr-icon>
        <UIcon name="i-ph-cursor" class="w-4 h-4 opacity-80" />
      </template>
    </GraphButtonGroup>
    <GraphData v-if="!graphless" class="w-full" :value="graph!" :columns="['keywords']" :colors="graphColours" @tooltip="e => tooltipData = e" />
  </div>
</template>

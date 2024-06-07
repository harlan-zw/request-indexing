<script lang="ts" setup>
import type { SiteDateAnalyticsSelect, SiteSelect } from '~/server/database/schema'
import type { GraphButton } from '~/components/GraphButtonGroup.vue'

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
      ctr: d.ctr * 100,
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

const graphColours = {
  keywords: {
    // indigo
    topColor: 'rgba(63, 81, 181, 0.9)',
    bottomColor: 'rgba(63, 81, 181, 0.04)',
    lineColor: 'rgba(63, 81, 181, 0.5)',
  },
}

const buttons = computed<GraphButton[]>(() => [
  {
    key: 'keywords',
    label: 'Keywords',
    value: typeof tooltipEntry.value?.keywords !== 'undefined' ? tooltipEntry.value.keywords : props.period?.keywords,
    color: 'blue',
  },
  {
    key: 'ctr',
    label: 'CTR',
    value: `${typeof tooltipEntry.value?.ctr !== 'undefined' ? tooltipEntry.value.ctr : props.period?.ctr * 100}`,
    color: 'orange',
  },
])

const selectedCharts = ref(['keywords', 'ctr'])

function toggleChart(chart: string) {
  if (selectedCharts.value.includes(chart)) {
    selectedCharts.value = selectedCharts.value.filter(e => e !== chart)
  }
  else {
    selectedCharts.value = [...selectedCharts.value, chart]
  }
}
</script>

<template>
  <div class="transition group">
    <GraphButtonGroup :buttons="buttons" :model-value="selectedCharts" @update:model-value="toggleChart">
      <template #keywords-icon>
        <UIcon name="i-ph-list-magnifying-glass" class="w-4 h-4 opacity-80" />
      </template>
      <template #keywords-trend>
        <TrendPercentage compact :value="period?.keywords" :prev-value="prevPeriod?.keywords" />
      </template>
      <template #ctr-trend>
        <TrendPercentage compact :value="period?.ctr" :prev-value="prevPeriod?.ctr" />
      </template>
      <template #ctr-icon>
        <UIcon name="i-ph-cursor" class="w-4 h-4 opacity-80" />
      </template>
    </GraphButtonGroup>
    <GraphData v-if="!graphless" class="w-full" :value="graph!" :columns="selectedCharts" :colors="graphColours" @tooltip="e => tooltipData = e" />
  </div>
</template>

<script lang="ts" setup>
import type { SiteDateAnalyticsSelect, SiteSelect } from '~/server/database/schema'

const props = defineProps<{
  site: SiteSelect
  dates: SiteDateAnalyticsSelect[]
  period: SiteDateAnalyticsSelect
  prevPeriod: SiteDateAnalyticsSelect
  graphless: boolean
}>()

const graph = computed(
  () => (props.dates || []),
)

// const lastEntry = computed(() => {
//   if (!props.dates?.length)
//     return null
//   return props.dates[props.dates.length - 1]
// })

const graphColours = {
  keywords: {
    // indigo
    topColor: 'rgba(63, 81, 181, 0.9)',
    bottomColor: 'rgba(63, 81, 181, 0.04)',
    lineColor: 'rgba(63, 81, 181, 0.5)',
  },
}
</script>

<template>
  <div class="w-[120px] transition group">
    <div class="text-xs flex items-center gap-1">
      <UIcon name="i-ph-list-magnifying-glass" class="w-4 h-4 opacity-80" />
      <div class="opacity-70">
        Keywords
      </div>
    </div>
    <div class="flex items-center gap-1">
      <div class="text-xl font-semibold">
        {{ useHumanFriendlyNumber(period?.keywords) }}
      </div>
      <TrendPercentage compact :value="period?.keywords" :prev-value="prevPeriod?.keywords" />
    </div>
    <GraphData v-if="!graphless" :value="graph!" :columns="['keywords']" :colors="graphColours" @tooltip="e => tooltipData = e" />
  </div>
</template>

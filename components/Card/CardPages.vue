<script lang="ts" setup>
import type { SiteDateAnalyticsSelect, SiteSelect } from '~/server/database/schema'

const props = defineProps<{
  site: SiteSelect
  dates: SiteDateAnalyticsSelect[]
  period: SiteDateAnalyticsSelect
  prevPeriod: SiteDateAnalyticsSelect
}>()

const graph = computed(
  () => (props.dates || []).map((_, i) => {
    // need to compute indexedPagesCount, it should be the MAX of all of the previous row pages count
    return {
      date: _.date,
      pages: props.dates.slice(0, i)
        .reduce((acc, row) => Math.max(acc, row.pages), 0),
    }
  }),
)

const lastEntry = computed(() => {
  if (!props.dates?.length)
    return null
  return props.dates[props.dates.length - 1]
})

const graphColours = {
  pages: {
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
        Pages
      </div>
    </div>
    <div class="flex items-center gap-1">
      <div class="text-xl font-semibold">
        {{ useHumanFriendlyNumber(lastEntry?.pages) }}
      </div>
      <TrendPercentage :value="period?.pages" :prev-value="prevPeriod?.pages" />
    </div>
    <GraphData :value="graph!" :columns="['pages']" :colors="graphColours" @tooltip="e => tooltipData = e" />
  </div>
</template>

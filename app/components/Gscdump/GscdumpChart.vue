<script lang="ts" setup>
import type { GraphButton } from '~/components/GraphButtonGroup.vue'
import { googleSearchConsoleColumns } from '~/composables/state'

const props = withDefaults(defineProps<{
  gscdumpSiteId: string
  period?: import('~/composables/useGscdump').Period
  fill?: boolean
  selectedCharts?: string[]
  extraFilters?: Array<{ type: string, column: string, value: string }>
}>(), {
  fill: false,
})

const { period: dashboardPeriod } = useDashboardPeriod()
const activePeriod = computed(() => props.period || dashboardPeriod.value)

const { data, status } = useGscdumpDates(
  () => props.gscdumpSiteId,
  activePeriod,
)

const graph = computed(() => {
  if (!data.value?.dates?.length)
    return []
  const period = data.value.period
  return data.value.dates.map((row) => {
    const clicks = row.clicks || 0
    const impressions = row.impressions || 0
    return {
      ...row,
      clicksRelative: period.clicks ? (clicks / period.clicks) * 33 : 0,
      impressionsRelative: period.impressions ? (impressions / period.impressions) * 100 : 0,
      ctrRelative: impressions ? (clicks / impressions) * 100 : 0,
    }
  })
})

const tooltipData = ref<Record<string, any> | null>(null)

const buttons = computed<GraphButton[]>(() => {
  const period = data.value?.period
  return [
    {
      key: 'clicks',
      label: 'Clicks',
      value: tooltipData.value?.clicks ?? period?.clicks ?? 0,
      color: 'blue',
    },
    {
      key: 'impressions',
      label: 'Views',
      value: tooltipData.value?.impressions ?? period?.impressions ?? 0,
      color: 'purple',
    },
    {
      key: 'position',
      label: 'Position',
      value: tooltipData.value?.position ?? period?.position ?? 0,
      color: 'orange',
    },
    {
      key: 'ctr',
      label: 'CTR',
      value: ((tooltipData.value?.ctr ?? period?.ctr ?? 0) * 100),
      color: 'green',
    },
  ]
})

const prevPeriod = computed(() => data.value?.prevPeriod)
</script>

<template>
  <div class="flex flex-col justify-center">
    <div v-if="status === 'pending'" class="flex items-center justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
    </div>
    <template v-else-if="data?.dates?.length">
      <GraphButtonGroup v-model="googleSearchConsoleColumns" :buttons="buttons" class="mb-2">
        <template #clicks-icon>
          <IconClicks class="w-4 h-4 opacity-80" />
        </template>
        <template #clicks-trend>
          <TrendPercentage v-if="!tooltipData && data?.period" compact :value="data.period.clicks" :prev-value="prevPeriod?.clicks" />
        </template>
        <template #impressions-icon>
          <IconImpressions class="w-4 h-4 opacity-80" />
        </template>
        <template #impressions-trend>
          <TrendPercentage v-if="!tooltipData && data?.period" compact :value="data.period.impressions" :prev-value="prevPeriod?.impressions" />
        </template>
        <template #position-icon>
          <IconPosition class="w-4 h-4 opacity-80" />
        </template>
        <template #position-trend>
          <TrendPercentage v-if="!tooltipData && data?.period" compact negative :value="data.period.position" :prev-value="prevPeriod?.position" />
        </template>
        <template #ctr-trend>
          <TrendPercentage v-if="!tooltipData && data?.period" compact negative :value="data.period.ctr" :prev-value="prevPeriod?.ctr" />
        </template>
      </GraphButtonGroup>
      <GraphDataNext
        v-if="googleSearchConsoleColumns.length"
        :height="fill ? 300 : 100"
        :value="graph"
        :columns="googleSearchConsoleColumns"
        @tooltip="e => tooltipData = e"
      />
    </template>
    <div v-else class="text-sm text-gray-500 py-4">
      No data available for this period.
    </div>
  </div>
</template>

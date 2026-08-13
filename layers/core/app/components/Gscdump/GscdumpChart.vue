<script lang="ts" setup>
import type { GraphButton } from '~~/layers/design-system/components/chart/GraphButtonGroup.vue'
import { googleSearchConsoleColumns } from '~~/layers/core/app/composables/state'

const props = withDefaults(defineProps<{
  gscdumpSiteId: string
  period?: import('~~/layers/core/app/composables/useGscdump').Period
  fill?: boolean
}>(), {
  fill: false,
})

const { period: dashboardPeriod } = useDashboardPeriod()
const activePeriod = computed(() => props.period || dashboardPeriod.value)

const { data, status, error, refresh } = useGscdumpDates(
  () => props.gscdumpSiteId,
  activePeriod,
)

const graph = computed(() => {
  if (!data.value?.dates?.length)
    return []
  return data.value.dates.map((row) => {
    return {
      ...row,
    }
  })
})

interface ChartTooltipData {
  clicks?: number
  impressions?: number
  position?: number
  ctr?: number
}

const tooltipData = ref<ChartTooltipData | null>(null)

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
  <div class="flex min-w-0 flex-col justify-center">
    <div v-if="status === 'pending'" class="flex items-center justify-center py-8" aria-live="polite">
      <UIcon name="i-heroicons-arrow-path" class="size-5 animate-spin text-muted" />
      <span class="sr-only">Loading performance data</span>
    </div>
    <div v-else-if="error" class="flex min-h-24 items-center justify-center gap-3 text-sm text-muted" role="alert">
      <span>Performance data could not load.</span>
      <UButton label="Retry" color="neutral" variant="outline" size="sm" class="min-h-10" @click="refresh()" />
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
        <template #ctr-icon>
          <IconCtr class="size-4 text-emerald-500 opacity-80" />
        </template>
        <template #ctr-trend>
          <TrendPercentage v-if="!tooltipData && data?.period" compact :value="data.period.ctr" :prev-value="prevPeriod?.ctr" />
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
    <div v-else class="py-4 text-sm text-muted">
      No data available for this period.
    </div>
  </div>
</template>

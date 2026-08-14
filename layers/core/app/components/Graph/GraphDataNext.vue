<script lang="ts" setup generic="I extends { date: string | number | Date, clicks?: number | null, impressions?: number | null, position?: number | null, ctr?: number | null }">
import { Scale } from '@unovis/ts'
import { VisArea, VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import { format } from 'date-fns'
import { graphLineMode } from '~~/layers/core/app/composables/state'
import { resolveMetricDomain, resolvePlotRange } from '~~/layers/core/app/utils/dashboard-site-card'
import { gscMetricColors } from '~~/layers/design-system/composables/proDataVizColors'

type MetricKey = 'clicks' | 'impressions' | 'position' | 'ctr'

const props = defineProps<{
  value: I[]
  columns?: MetricKey[]
  colors?: Partial<Record<MetricKey, string>>
  height?: number | string
}>()

const emits = defineEmits<{
  tooltip: [data: I | null]
}>()

const value = computed(() => props.value)
const selectedColumns = computed(() => new Set(props.columns ?? []))
const chartHeight = computed(() => Number(props.height) || 100)
const chartMargin = { left: 0, right: 0, top: 0, bottom: 24 }
const chartId = useId().replace(/:/g, '')
const clicksGradientId = `clicks-gradient-${chartId}`
const metricColors = computed(() => ({
  clicks: props.colors?.clicks ?? gscMetricColors.clicks.hex,
  impressions: props.colors?.impressions ?? gscMetricColors.impressions.hex,
  position: props.colors?.position ?? gscMetricColors.position.hex,
  ctr: props.colors?.ctr ?? gscMetricColors.ctr.hex,
}))

const svgDefs = computed(() => `
  <linearGradient id="${clicksGradientId}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${metricColors.value.clicks}" stop-opacity="0.24" />
    <stop offset="100%" stop-color="${metricColors.value.clicks}" stop-opacity="0.02" />
  </linearGradient>
`)

function tickFormat(index: number) {
  const safeIndex = Math.min(value.value.length - 1, Math.max(0, Math.round(index)))
  const row = value.value[safeIndex]
  return row ? format(new Date(row.date), 'MMM d') : ''
}

function template(d: I) {
  emits('tooltip', d)
  return `<div class="mb-2 text-sm text-muted">${format(new Date(d.date), 'MMM d')}</div>
    <div class="grid grid-cols-2 gap-1 text-sm text-default tabular-nums">
      <div>Clicks: ${useHumanFriendlyNumber(d.clicks ?? 0)}</div>
      <div>Views: ${useHumanFriendlyNumber(d.impressions ?? 0)}</div>
      <div>Position: ${useHumanFriendlyNumber(d.position ?? 0)}</div>
      <div>CTR: ${useHumanFriendlyNumber((d.ctr ?? 0) * 100)}%</div>
  </div>`
}

function metricScale(key: MetricKey, inverted = false) {
  return computed(() => Scale.scaleLinear()
    .domain(resolveMetricDomain(value.value.map(row => key === 'ctr' ? (row.ctr ?? 0) * 100 : (row[key] ?? 0))))
    .range(resolvePlotRange(chartHeight.value, inverted)))
}

const clicksScale = metricScale('clicks')
const impressionsScale = metricScale('impressions')
const positionScale = metricScale('position', true)
const ctrScale = metricScale('ctr')

const clicks = (d: I) => d.clicks ?? 0
const position = (d: I) => d.position ?? 0
const ctr = (d: I) => (d.ctr ?? 0) * 100
const impressions = (d: I) => d.impressions ?? 0
const x = (_d: I, index: number) => index
</script>

<template>
  <div
    class="relative w-full min-w-0 overflow-clip"
    role="img"
    aria-label="Search performance trend chart"
    :style="{ height: `${chartHeight}px` }"
    @mouseleave="emits('tooltip', null)"
  >
    <VisXYContainer :height="chartHeight" :data="value" :svg-defs="svgDefs" :margin="chartMargin" :auto-margin="false" class="graph-next">
      <VisLine v-if="selectedColumns.has('impressions')" :curve-type="graphLineMode" :data="value" :x="x" :color="metricColors.impressions" :y-scale="impressionsScale" :y="impressions" />
      <VisArea v-if="selectedColumns.has('clicks')" :color="`url(#${clicksGradientId})`" :x="x" :y-scale="clicksScale" :y="clicks" />
      <VisLine v-if="selectedColumns.has('clicks')" :curve-type="graphLineMode" :data="value" :x="x" :color="metricColors.clicks" :y-scale="clicksScale" :y="clicks" />
      <VisLine v-if="selectedColumns.has('position')" :x="x" :y-scale="positionScale" :y="position" :color="metricColors.position" />
      <VisLine v-if="selectedColumns.has('ctr')" :x="x" :y="ctr" :y-scale="ctrScale" :color="metricColors.ctr" />
      <VisCrosshair :template="template" />
      <VisTooltip />
      <VisAxis type="x" tick-text-align="left" :tick-line="false" :grid-line="false" :domain-line="false" :num-ticks="3" :tick-format="tickFormat" tick-padding="4" tick-text-font-size="12px" tick-text-color="var(--ui-text-dimmed)" />
    </VisXYContainer>
  </div>
</template>

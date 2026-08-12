<script lang="ts" setup generic="I extends { date: string | number | Date, clicks: number, impressions: number, position: number, ctr: number }">
import { Area, Scale } from '@unovis/ts'
import { VisArea, VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import { addDays, format, subDays } from 'date-fns'
import { graphLineMode } from '~~/layers/core/app/composables/state'

type MetricKey = 'clicks' | 'impressions' | 'position' | 'ctr'

const props = defineProps<{
  value: I[]
  columns?: (MetricKey | { key: MetricKey, type: 'area' | 'line' })[]
  colors?: Partial<Record<MetricKey, string>>
  height?: number | string
  labels?: boolean
}>()

const emits = defineEmits<{
  tooltip: [data: I | null]
}>()

const value = computed(() => props.value)
const selectedColumns = computed(() => props.columns ?? [])

const svgDefs = `
    <linearGradient id="gradient0" gradientTransform="rotate(90)" style="background-color: red;">
      <stop offset="20%" stop-color="rgba(33, 150, 243, 1" />
      <stop offset="40%" stop-color="rgba(33, 150, 243, 0.25)" />
      <stop offset="60%" stop-color="rgba(33, 150, 243, 0.2)" />
      <stop offset="80%" stop-color="rgba(33, 150, 243, 0.1)" />
    </linearGradient>
  <linearGradient id="gradient1" gradientTransform="rotate(90)">
      <stop offset="20%" stop-color="rgba(56, 39, 176, 0.3)" />
      <stop offset="40%" stop-color="rgba(56, 39, 176, 0.2)" />
      <stop offset="60%" stop-color="rgba(56, 39, 176, 0.1)" />
      <stop offset="80%" stop-color="rgba(56, 39, 176, 0.05)" />
    </linearGradient>`
function tickFormat(d: number) {
  // minus 90 days plus d
  return format(addDays(subDays(new Date(), props.value.length), d), 'MMM d')
}

let isMouseOver = false
function template(d: I) {
  if (isMouseOver) {
    emits('tooltip', d)
  }
  return `<div class="text-sm text-gray-600 mb-2">${format(new Date(d.date), 'MMM d')}</div>
    <div class="grid grid-cols-2 text-xs gap-1">
      <div>Clicks: ${useHumanFriendlyNumber(d.clicks)}</div>
      <div>Views: ${useHumanFriendlyNumber(d.impressions)}</div>
      <div>Position: ${useHumanFriendlyNumber(d.position)}</div>
      <div>CTR: ${useHumanFriendlyNumber(d.ctr * 100)}%</div>
  </div>`
}

const events = {
  [Area.selectors.area]: {
    mouseover: () => {
      isMouseOver = true
    },
    mouseleave: () => {
      isMouseOver = false
      emits('tooltip', null)
    },
  },
}

// Pixel band every series is drawn into. The container is 100px tall and the
// x-axis takes the remainder.
const PLOT_RANGE: [number, number] = [80, 0]

// Count-like series are scaled from zero, not from their own minimum. With a
// `[min, max]` domain a metric that is zero on most days mapped every one of
// those days onto the same pixel row, which is why clicks rendered as a flat
// line at y=80 with occasional blips instead of a curve.
function countScale(values: number[]) {
  const max = Math.max(0, ...values)
  return Scale.scaleLinear().domain([0, max || 1]).range(PLOT_RANGE)
}

// Position is ranking, not a count: it never approaches zero and a [min, max]
// domain is the right window for it.
const positionScale = computed(() => Scale.scaleLinear()
  .domain([Math.min(...value.value.map(d => d.position)), Math.max(...value.value.map(d => d.position))])
  .range(PLOT_RANGE))

const clicksScale = computed(() => countScale(value.value.map(d => d.clicks)))

// Impressions had no scale of its own, so it fell back to the shared container
// scale and drew at negative y — clipped off the top edge of the chart.
const impressionsScale = computed(() => countScale(value.value.map(d => d.impressions)))

const ctrScale = computed(() => countScale(value.value.map(d => d.ctr * 100)))

const clicks = (d: I) => d.clicks
const position = (d: I) => d.position
const ctr = (d: I) => d.ctr * 100
const impressions = (d: I) => d.impressions
const x = (_d: I, index: number) => index
</script>

<template>
  <div class="relative">
    <!--    <UButton -->
    <!--      size="xs" color="neutral" variant="link" class="absolute -top-12 -right-2" icon="i-ph-chart-line" -->
    <!--      @click="graphLineMode = 'step'" -->
    <!--    /> -->
    <VisXYContainer height="100" :data="value" :svg-defs="svgDefs" class="graph-next">
      <!--  impressions  -->
      <VisLine v-if="selectedColumns.includes('impressions')" :curve-type="graphLineMode" :data="value" :x="x" color="rgba(156, 39, 176, 0.7)" :y-scale="impressionsScale" :y="impressions" :events="events" />
      <!--  clicks  -->
      <VisArea v-if="selectedColumns.includes('clicks')" color="url(#gradient0)" :x="x" :y-scale="clicksScale" :y="clicks" />
      <!--  position  -->
      <VisLine v-if="selectedColumns.includes('position')" :x="x" :y-scale="positionScale" :y="position" color="orange" />
      <VisLine v-if="selectedColumns.includes('ctr')" :x="x" :y="ctr" :y-scale="ctrScale" color="green" />
      <VisCrosshair :template="template" />
      <VisTooltip />
      <VisAxis type="x" tick-text-align="left" :tick-line="false" :grid-line="false" :num-ticks="3" :tick-format="tickFormat" tick-padding="0" tick-text-font-size="10px" />
    </VisXYContainer>
  </div>
</template>

<style>
  .css-wwpzge-area:first-child {
    stroke: rgba(156, 39, 176, 0.5);
    stroke-width: 2px !important;
  }

  .css-1r2ccq4-area-component > path {
    stroke: hsl(207 75% 65% / 1) !important;
    stroke-width: 2px !important;
  }
  .css-1sev1n1-tooltip {
    bottom: 0 !important;
  }
</style>

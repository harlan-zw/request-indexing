<script lang="ts" setup generic="T extends Record<string, any>[], I extends T[0]">
import { VisArea, VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import { Area, Scale } from '@unovis/ts'
import { graphLineMode } from '~/composables/state'

const props = defineProps<{
  value: T
  columns?: (keyof I | { key: keyof I, type: 'area' | 'line' })[]
  colors?: Record<keyof I, string>
  height?: number | string
  labels?: boolean
}>()

const emits = defineEmits<{
  tooltip: [data: T | null]
}>()

const { value } = toRefs(props)

const y = computed(() => {
  return props.columns?.map((col) => {
    if (typeof col === 'string') {
      return (d: I) => d[col]
    }
    else {
      return (d: I) => d[col.key]
    }
  })
})
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
const dayjs = useDayjs()
function tickFormat(d: number) {
  // dayjs, minus 90 days plus d
  return dayjs().subtract(props.value.length, 'days').add(d, 'days').format('MMM D')
}

let isMouseOver = false
function template(d: DataRecord) {
  if (isMouseOver) {
    emits('tooltip', d)
  }
  return `<div class="text-sm text-gray-600 mb-2">${dayjs(d.date).format('MMM D')}</div>
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
    mouseleave: (data: DataRecord[]) => {
      isMouseOver = false
      emits('tooltip', null)
    },
  },
}

const positionScale = computed(() => Scale.scaleLinear()
  .domain([Math.min(...value.value.map((d: any) => d.position)), Math.max(...value.value.map((d: any) => d.position))])
  .range([80, 0]))

const clicksScale = computed(() => Scale.scaleLinear()
  .domain([Math.min(...value.value.map((d: any) => d.clicks)), Math.max(...value.value.map((d: any) => d.clicks))])
  .range([80, 0]))

const ctrScale = computed(() => Scale.scaleLinear()
  .domain([Math.min(...value.value.map((d: any) => d.ctr * 100)), Math.max(...value.value.map((d: any) => d.ctr * 100))])
  .range([80, 0]))

const clicks = (d: I) => d.clicks
const position = (d: I) => d.position
const ctr = (d: I) => d.ctr * 100
const impressions = (d: I) => d.impressions
</script>

<template>
  <div class="relative">
<!--    <UButton-->
<!--      size="xs" color="gray" variant="link" class="absolute -top-12 -right-2" icon="i-ph-chart-line"-->
<!--      @click="graphLineMode = 'step'"-->
<!--    />-->
    <VisXYContainer height="100" :data="value" :svg-defs="svgDefs" class="graph-next">
      <!--  impressions  -->
      <VisLine v-if="columns.includes('impressions')" :curve-type="graphLineMode" :data="value" :x="(d, i) => i" color="rgba(156, 39, 176, 0.7)" :y="impressions" :events="events" />
      <!--  clicks  -->
      <VisArea v-if="columns.includes('clicks')" color="url(#gradient0)" :x="(d, i) => i" :y-scale="clicksScale" :y="clicks" />
      <!--  position  -->
      <VisLine v-if="columns.includes('position')" :x="(d, i) => i" :y-scale="positionScale" :y="position" color="orange" />
      <VisLine v-if="columns.includes('ctr')" :x="(d, i) => i" :y="ctr" :y-scale="ctrScale" color="green" />
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

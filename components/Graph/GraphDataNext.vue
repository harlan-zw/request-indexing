<script lang="ts" setup generic="T extends Record<string, any>[], I extends T[0]">
import { VisArea, VisCrosshair, VisAxis, VisGroupedBar, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import {Area, Scale} from '@unovis/ts'
import {graphLineMode} from "~/composables/state";

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
  return dayjs().subtract(90, 'days').add(d, 'days').format('MMM D')
}

let isMouseOver = false
const template = (d: DataRecord) => {
  if (isMouseOver) {
    emits('tooltip', d)
  }
  return `<div>${dayjs(d.date).format('MMM D')}</div><div>${props.columns.map(col => `${col}: ${useHumanFriendlyNumber(d[col])}`).join('</div><div>')}</div>`
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
  }
}

const yScale = Scale.scaleLinear()
  .domain([0, 200])
  .range([100, 0])
</script>

<template>
<div class="relative">
  <UButton @click="graphLineMode = 'step'" size="xs" color="gray" variant="link" class="absolute -top-12 -right-2"
   icon="i-ph-chart-line"
   />
  <VisXYContainer height="100" :data="value" :svg-defs="svgDefs" class="graph-next">
    <!--  <div v-show="tooltipData?.time" class="absolute -bottom-4 left-1/2 -translate-x-1/2 transform text-center text-sm"> -->
    <!--    {{ $dayjs(tooltipData?.time).format('MMMM D, YYYY') }} -->
    <!--  </div> -->
    <VisArea :curve-type="graphLineMode" :data="value" :x="(d, i) => i" :y="y[1]" :color="(d, i: number) => ['url(#gradient1)','url(#gradient1)'][i]" :events="events" />
<!--    <VisArea :min-height1-px="true" color="url(#gradient1)" curve-type="step" :x="(d, i) => i" :y="y[0]" :attributes="attributes1" />-->
    <VisGroupedBar color="url(#gradient0)" :yScale="yScale" :x="(d, i) => i" :y="y[0]" />
    <VisLine :y-scale="yScale" :x="(d, i) => i" :y="y[2]" color="orange" />
    <VisCrosshair :template="template" />
    <VisTooltip />
    <VisAxis type="x" tickTextAlign="left" :tick-line="false" :grid-line="false" :num-ticks="3" :tick-format="tickFormat" tick-padding="0" tick-text-font-size="10px" />
  </VisXYContainer>
</div>
</template>
<style>
  .css-wwpzge-area:first-child {
    stroke: rgba(156, 39, 176, 0.5);
    stroke-width: 2px !important;
  }

  .css-wwpzge-area:nth-child(2) {
    stroke: hsl(207 75% 65% / 1) !important;
    stroke-width: 2px !important;
  }
  .css-1sev1n1-tooltip {
    bottom: 0 !important;
  }
</style>

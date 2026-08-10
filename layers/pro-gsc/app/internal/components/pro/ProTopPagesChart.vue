<script lang="ts" setup>
import { TextAlign } from '@unovis/ts'
import { VisArea, VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'

export interface TopPagesDataRow {
  date: string
  /** clicks per page slot, index 0–4 = top pages, 5 = "other" */
  pages: number[]
}

const { data, labels, loading, colorSet } = defineProps<{
  data: TopPagesDataRow[]
  labels: string[]
  loading?: boolean
  /** Custom color palette (array of { bg, hex }). Falls back to gscTopPagesColors. */
  colorSet?: Array<{ bg: string, hex: string }>
}>()

const margin = { left: 0, right: 0, top: 4, bottom: 28 }
const chartHeight = 160

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

function tickFormat(d: number) {
  const row = data[Math.round(d)]
  if (!row?.date)
    return ''
  return dateFormatter.format(new Date(row.date))
}

const palette = computed(() => colorSet || gscTopPagesColors)

// Number of series = top N pages + "other"
const seriesCount = computed(() => {
  if (!data.length)
    return 0
  return data[0]?.pages.length ?? 0
})

// y: array of accessor functions, one per series
// Stack order: index 0 = bottom (Other), last = top (top page)
const y = computed(() => {
  const count = seriesCount.value
  if (!count)
    return [(d: TopPagesDataRow) => d.pages[0] || 0]
  const accessors: Array<(d: TopPagesDataRow) => number> = []
  for (let i = count - 1; i >= 0; i--) {
    accessors.push((d: TopPagesDataRow) => d.pages[i] || 0)
  }
  return accessors
})

// Color accessor function matching the pattern from makeColorAccessors
// VisArea internally reverses with areaMaxIdx - i, so we pass colors reversed
const color = computed(() => {
  const hexColors = Array.from({ length: seriesCount.value }, (_, i) =>
    palette.value[i]?.hex || '#a3a3a340')
  return (_data: TopPagesDataRow[], index: number) => {
    const reversed = hexColors.toReversed()
    return reversed[index % reversed.length] || '#a3a3a340'
  }
})

const yDomain = computed<[number, number]>(() => {
  const max = Math.max(...data.map(d => d.pages.reduce((s, v) => s + v, 0)), 1)
  return [0, max * 1.1]
})

const chartKey = computed(() => `${data.length}-${seriesCount.value}`)
const x = (_d: TopPagesDataRow, i: number) => i

function crosshairTemplate(d: TopPagesDataRow) {
  const rows = labels
    .map((label, i) => {
      const clicks = d.pages[i] || 0
      if (!clicks)
        return ''
      return `<div class="flex items-center gap-1.5">
        <span class="inline-block size-2 rounded-full" style="background:${palette.value[i]?.hex || '#a3a3a340'}"></span>
        <span class="truncate max-w-[180px]">${label}</span>
        <span class="ml-auto font-medium tabular-nums">${formatNumber(clicks)}</span>
      </div>`
    })
    .filter(Boolean)
    .join('')

  const total = d.pages.reduce((s, v) => s + v, 0)
  return `<div class="px-2.5 py-2 text-xs space-y-1">
    <div class="flex items-center justify-between text-dimmed mb-1.5">
      <span>${dateFormatter.format(new Date(d.date))}</span>
      <span class="font-medium tabular-nums">${formatNumber(total)}</span>
    </div>
    ${rows}
  </div>`
}
</script>

<template>
  <div
    data-ui="ProTopPagesChart"
    class="top-pages-chart"
    role="img"
    aria-label="Top pages traffic trend chart"
    :style="{ height: `${chartHeight}px` }"
  >
    <div v-if="loading" class="loading-skeleton">
      <div class="flex-1 flex items-end gap-1">
        <UiSkeleton v-for="i in 20" :key="i" type="bar" :index="i" />
      </div>
    </div>

    <template v-else>
      <!-- Stacked area chart -->
      <VisXYContainer
        :key="`area-${chartKey}`"
        :height="chartHeight"
        :data="data"
        :margin="margin"
        :auto-margin="false"
        class="chart-layer"
        :y-domain="yDomain"
      >
        <VisArea
          :color="color"
          :x="x"
          :y="y"
          curve-type="monotoneX"
        />
      </VisXYContainer>

      <!-- Interactive layer: axis + crosshair -->
      <VisXYContainer
        :key="`interactive-${chartKey}`"
        :height="chartHeight"
        :data="data"
        :margin="margin"
        :auto-margin="false"
        class="chart-layer chart-layer--interactive"
        :y-domain="yDomain"
      >
        <VisLine :x="x" :y="(d: TopPagesDataRow) => d.pages.reduce((s, v) => s + v, 0)" color="transparent" :line-width="0" />
        <VisAxis
          type="x"
          :tick-line="false"
          :grid-line="false"
          :domain-line="false"
          :num-ticks="4"
          :tick-format="tickFormat"
          :tick-text-align="TextAlign.Left"
          tick-text-font-size="10px"
          tick-text-color="var(--ui-text-dimmed)"
        />
        <VisTooltip />
        <VisCrosshair color="none" :template="crosshairTemplate" />
      </VisXYContainer>
    </template>
  </div>
</template>

<style scoped>
.top-pages-chart {
  display: grid;
  grid-template-columns: 1fr;
}

.top-pages-chart .chart-layer,
.top-pages-chart .loading-skeleton {
  grid-column-start: 1;
  grid-row-start: 1;
}

.top-pages-chart .chart-layer {
  pointer-events: none;
}

.top-pages-chart .chart-layer--interactive {
  pointer-events: auto;
  --vis-crosshair-line-stroke-color: var(--ui-border-accented);
  --vis-crosshair-line-stroke-opacity: 0.6;
}

/* Remove stroke on area fill paths */
[data-ui="ProTopPagesChart"] :deep(.unovis-area-group path) {
  stroke: none;
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding-bottom: 1.5rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
}
</style>

<script lang="ts" setup>
import { TextAlign } from '@unovis/ts'
import { VisArea, VisAxis, VisCrosshair, VisLine, VisStackedBar, VisTooltip, VisXYContainer } from '@unovis/vue'

interface DataRow {
  date: string
  indexedPercent: number
  errors: number
  excluded?: number
}

const props = defineProps<{
  data: DataRow[]
  columns?: ('indexedPercent' | 'errors' | 'excluded')[]
  height?: number | string
  loading?: boolean
}>()

const emit = defineEmits<{
  tooltip: [data: DataRow | null]
}>()
const devSkeleton = useProDevSkeleton()
const loading = computed(() => props.loading || devSkeleton.value)

const margin = { left: 0, right: 0, top: 0, bottom: 36 }
const chartHeight = computed(() => Number(props.height) || 220)
const chartInnerHeight = computed(() => chartHeight.value - margin.top - margin.bottom)
// Errors bars render in the bottom third so they don't obscure the % composition
const errorsMargin = computed(() => ({
  left: 0,
  right: 0,
  top: Math.round(chartInnerHeight.value * 0.66),
  bottom: margin.bottom,
}))
// Healthy-zone thresholds (percent of URLs indexed). Values align with
// `thresholdColors(100 - indexedPercent, 10, 30)` used in the per-site cells:
// dropout <10% = healthy, <30% = warning, else critical. Converted to indexed%:
// ≥90% healthy, 70–90% warning, <70% critical.
const ZONE_HEALTHY_MIN = 90
const ZONE_WARNING_MIN = 70

const zoneBands = computed(() => {
  const innerH = chartInnerHeight.value
  const bottomOffset = margin.bottom
  const pct = (n: number) => (n / 100) * innerH
  return [
    { key: 'critical', bottom: bottomOffset, height: pct(ZONE_WARNING_MIN) },
    { key: 'warning', bottom: bottomOffset + pct(ZONE_WARNING_MIN), height: pct(ZONE_HEALTHY_MIN - ZONE_WARNING_MIN) },
    { key: 'healthy', bottom: bottomOffset + pct(ZONE_HEALTHY_MIN), height: pct(100 - ZONE_HEALTHY_MIN) },
  ]
})

const zoneThresholds = computed(() => {
  const innerH = chartInnerHeight.value
  const bottomOffset = margin.bottom
  return [
    { key: 'healthy', label: `${ZONE_HEALTHY_MIN}%`, bottom: bottomOffset + (ZONE_HEALTHY_MIN / 100) * innerH },
    { key: 'warning', label: `${ZONE_WARNING_MIN}%`, bottom: bottomOffset + (ZONE_WARNING_MIN / 100) * innerH },
  ]
})

const svgDefs = `
  <linearGradient id="gradient-indexed-stacked" gradientTransform="rotate(90)">
    <stop offset="0%" stop-color="rgba(34, 197, 94, 0.55)" />
    <stop offset="100%" stop-color="rgba(34, 197, 94, 0.12)" />
  </linearGradient>
  <linearGradient id="gradient-not-indexed-stacked" gradientTransform="rotate(90)">
    <stop offset="0%" stop-color="rgba(168, 85, 247, 0.08)" />
    <stop offset="100%" stop-color="rgba(168, 85, 247, 0.3)" />
  </linearGradient>`

// --- Calendar-aware tick planning (matches ProGraphGsc) ---
interface TickPlan {
  indices: number[]
  format: (date: Date, i: number, firstYear: number) => string
}

const weekdayDayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric' })
const monthDayFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'short' })
const monthYearFmt = new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' })

const tickPlan = computed<TickPlan>(() => {
  const len = props.data.length
  if (len <= 1)
    return { indices: [0], format: d => monthDayFmt.format(d) }

  if (len <= 10)
    return { indices: props.data.map((_, i) => i), format: d => weekdayDayFmt.format(d) }

  if (len <= 35) {
    const step = Math.max(1, Math.ceil(len / 5))
    const indices: number[] = []
    for (let i = 0; i < len; i += step) indices.push(i)
    if (indices[indices.length - 1] !== len - 1)
      indices.push(len - 1)
    return { indices, format: d => monthDayFmt.format(d) }
  }

  if (len <= 120) {
    const step = 14
    const indices: number[] = []
    for (let i = 0; i < len; i += step) indices.push(i)
    return { indices, format: d => monthDayFmt.format(d) }
  }

  const indices: number[] = []
  let lastMonth = ''
  for (let i = 0; i < len; i++) {
    const m = props.data[i]!.date.slice(0, 7)
    if (m !== lastMonth) {
      indices.push(i)
      lastMonth = m
    }
  }
  if (indices.length < 2)
    return { indices: [0, Math.floor(len / 2), len - 1], format: d => monthDayFmt.format(d) }
  if (indices.length > 14) {
    const keep = Math.ceil(indices.length / 12)
    const thinned = indices.filter((_, i) => i % keep === 0)
    return {
      indices: thinned,
      format: (d, i, firstYear) => (d.getMonth() === 0 || i === 0) && d.getFullYear() !== firstYear
        ? monthYearFmt.format(d)
        : monthFmt.format(d),
    }
  }
  return {
    indices,
    format: (d, i, _firstYear) => (d.getMonth() === 0 && i > 0) || (i === 0 && d.getMonth() !== 0 && indices.length > 6)
      ? monthYearFmt.format(d)
      : monthFmt.format(d),
  }
})

const firstTickYear = computed(() => {
  const first = tickPlan.value.indices[0]
  if (first == null || !props.data[first]?.date)
    return new Date().getFullYear()
  return Number(props.data[first].date.slice(0, 4))
})

function tickFormat(d: number) {
  const idx = Math.round(d)
  if (idx < 0 || idx >= props.data.length)
    return ''
  const row = props.data[idx]
  if (!row?.date)
    return ''
  const tickIdx = tickPlan.value.indices.indexOf(idx)
  return tickPlan.value.format(new Date(row.date), tickIdx, firstTickYear.value)
}

// Crosshair → parent renders the actual tooltip card
function crosshairTemplate(d: DataRow) {
  nextTick(() => emit('tooltip', d))
  return ''
}
function handleMouseLeave() {
  emit('tooltip', null)
}

const indexedDomain: [number, number] = [0, 100]
const errorsDomain = computed<[number, number]>(() => {
  const max = Math.max(...props.data.map(d => d.errors), 1)
  return [0, max * 1.1]
})
const excludedDomain = computed<[number, number]>(() => {
  const max = Math.max(...props.data.map(d => d.excluded ?? 0), 1)
  return [0, max * 1.1]
})

const chartKey = computed(() => {
  const len = props.data.length
  const first = props.data[0]?.date ?? ''
  const last = props.data[len - 1]?.date ?? ''
  return `${len}-${first}-${last}`
})

const x = (_d: DataRow, i: number) => i
const indexedPercent = (d: DataRow) => d.indexedPercent
const notIndexedPercent = (d: DataRow) => Math.max(0, 100 - d.indexedPercent)
const stackedY = [indexedPercent, notIndexedPercent]
function stackedColor(_d: DataRow, i: number) {
  return i === 0 ? 'url(#gradient-indexed-stacked)' : 'url(#gradient-not-indexed-stacked)'
}
const errors = (d: DataRow) => d.errors
const errorBarColor = (d: DataRow) => d.errors > 0 ? 'rgba(249, 115, 22, 0.75)' : 'transparent'
const excluded = (d: DataRow) => d.excluded ?? 0
</script>

<template>
  <div
    data-ui="GraphIndexing"
    class="indexing-chart"
    :style="{ height: `${chartHeight}px` }"
    @mouseleave="handleMouseLeave"
  >
    <!-- Loading skeleton -->
    <div v-if="loading" class="loading-skeleton">
      <div class="flex-1 flex items-end gap-1">
        <div v-for="i in 30" :key="i" class="flex-1 h-full flex">
          <UiSkeleton type="bar" :index="i" />
        </div>
      </div>
      <div class="flex justify-between mt-3">
        <UiSkeleton v-for="i in 5" :key="i" class="h-3 w-12" />
      </div>
    </div>

    <!-- Not enough data -->
    <div v-else-if="data.length < 2" class="flex flex-col items-center justify-center h-full text-center gap-1">
      <p class="text-sm text-muted">
        {{ data.length === 0 ? 'No indexing data for this period' : 'Only 1 day of data so far' }}
      </p>
      <p v-if="data.length === 1" class="text-xs text-dimmed">
        The chart will appear once more days are available
      </p>
    </div>

    <ClientOnly v-else>
      <!-- Healthy-zone background bands -->
      <div
        v-for="band in zoneBands"
        :key="band.key"
        class="zone-band"
        :class="`zone-band--${band.key}`"
        :style="{ bottom: `${band.bottom}px`, height: `${band.height}px` }"
        aria-hidden="true"
      />
      <!-- Threshold markers -->
      <div
        v-for="t in zoneThresholds"
        :key="t.key"
        class="zone-threshold"
        :class="`zone-threshold--${t.key}`"
        :style="{ bottom: `${t.bottom}px` }"
        aria-hidden="true"
      >
        <span class="zone-threshold__label">{{ t.label }}</span>
      </div>

      <!-- Layer 1: Stacked composition -->
      <VisXYContainer
        v-if="columns?.includes('indexedPercent')"
        :key="`indexed-${chartKey}`"
        :height="chartHeight"
        :data="data"
        :svg-defs="svgDefs"
        :margin="margin"
        :auto-margin="false"
        class="chart-layer"
        :y-domain="indexedDomain"
      >
        <VisArea
          curve-type="monotoneX"
          :x="x"
          :y="stackedY"
          :color="stackedColor"
        />
        <VisLine
          curve-type="monotoneX"
          :x="x"
          :y="indexedPercent"
          color="rgba(34, 197, 94, 0.95)"
          :line-width="2"
        />
      </VisXYContainer>

      <!-- Layer 2: Errors as bars -->
      <VisXYContainer
        v-if="columns?.includes('errors')"
        :key="`errors-${chartKey}`"
        :height="chartHeight"
        :data="data"
        :margin="errorsMargin"
        :auto-margin="false"
        class="chart-layer errors-layer"
        :y-domain="errorsDomain"
      >
        <VisStackedBar
          :x="x"
          :y="errors"
          :color="errorBarColor"
          :rounded-corners="2"
          :bar-padding="0.25"
        />
      </VisXYContainer>

      <!-- Layer 3: Excluded overlay -->
      <VisXYContainer
        v-if="columns?.includes('excluded')"
        :key="`excluded-${chartKey}`"
        :height="chartHeight"
        :data="data"
        :margin="margin"
        :auto-margin="false"
        class="chart-layer"
        :y-domain="excludedDomain"
      >
        <VisLine
          curve-type="monotoneX"
          :x="x"
          :y="excluded"
          color="rgba(168, 85, 247, 0.9)"
          :line-width="2"
        />
      </VisXYContainer>

      <!-- Layer 4: X-Axis + Crosshair (topmost, captures pointer events) -->
      <VisXYContainer
        :key="`interactive-${chartKey}`"
        :height="chartHeight"
        :data="data"
        :margin="margin"
        :auto-margin="false"
        class="chart-layer chart-layer--interactive"
      >
        <!-- Invisible line so crosshair has data points to snap to -->
        <VisLine :x="x" :y="indexedPercent" color="transparent" :line-width="0" />
        <VisAxis
          type="x"
          :tick-line="false"
          :grid-line="false"
          :domain-line="false"
          :tick-values="tickPlan.indices"
          :tick-format="tickFormat"
          :tick-text-align="TextAlign.Left"
          tick-text-font-size="11px"
          tick-text-color="var(--ui-text-dimmed)"
        />
        <VisTooltip :follow-cursor="false" horizontal-placement="right" />
        <VisCrosshair color="none" :template="crosshairTemplate" />
      </VisXYContainer>

      <template #fallback>
        <div class="loading-skeleton">
          <div class="flex-1 flex items-end gap-1">
            <div v-for="i in 30" :key="i" class="flex-1">
              <UiSkeleton type="bar" :index="i" />
            </div>
          </div>
          <div class="flex justify-between mt-3">
            <UiSkeleton v-for="i in 5" :key="i" class="h-3 w-12" />
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.indexing-chart {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
}

.indexing-chart .chart-layer,
.indexing-chart .loading-skeleton {
  grid-column-start: 1;
  grid-row-start: 1;
}

.indexing-chart .chart-layer {
  pointer-events: none;
}

.indexing-chart .chart-layer--interactive {
  pointer-events: auto;
  --vis-crosshair-line-stroke-color: var(--ui-border-accented);
  --vis-crosshair-line-stroke-opacity: 0.6;
}

.indexing-chart .chart-layer--interactive :deep(.unovis-tooltip) {
  display: none;
}

.indexing-chart :deep(.unovis-area-group path) {
  stroke: none;
}

.loading-skeleton {
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding-bottom: 2rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.zone-band {
  position: absolute;
  left: 0;
  right: 0;
  pointer-events: none;
  z-index: 0;
}

.zone-band--critical {
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--color-error-500) 7%, transparent),
    color-mix(in srgb, var(--color-error-500) 2%, transparent)
  );
}

.zone-band--warning {
  background: color-mix(in srgb, var(--color-warning-500) 5%, transparent);
}

.zone-band--healthy {
  background: linear-gradient(
    to top,
    color-mix(in srgb, var(--color-success-500) 3%, transparent),
    color-mix(in srgb, var(--color-success-500) 8%, transparent)
  );
}

.zone-threshold {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  pointer-events: none;
  z-index: 1;
  border-top: 1px dashed;
}

.zone-threshold--healthy {
  border-color: color-mix(in srgb, var(--color-success-500) 35%, transparent);
}

.zone-threshold--warning {
  border-color: color-mix(in srgb, var(--color-warning-500) 30%, transparent);
}

.zone-threshold__label {
  position: absolute;
  right: 0;
  top: -7px;
  font-size: 10px;
  line-height: 1;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--ui-bg);
  color: var(--ui-text-dimmed);
  font-variant-numeric: tabular-nums;
}
</style>

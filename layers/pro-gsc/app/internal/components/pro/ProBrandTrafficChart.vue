<script lang="ts" setup>
import { Scale, TextAlign } from '@unovis/ts'
import { VisAxis, VisCrosshair, VisLine, VisStackedBar, VisTooltip, VisXYContainer } from '@unovis/vue'
import { GSC_STABLE_LATENCY_DAYS } from '../../../composables/useGscPeriod'

interface BrandDataRow {
  date: string
  brand: number
  nonBrand: number
}

const { data, loading, height = 160 } = defineProps<{
  data: BrandDataRow[]
  loading?: boolean
  height?: number
}>()

const emit = defineEmits<{
  tooltip: [data: BrandDataRow | null, isEstimated: boolean]
}>()

const margin = { left: 0, right: 0, top: 6, bottom: 28 }
const chartHeight = computed(() => height)
const chartInnerHeight = computed(() => chartHeight.value - margin.top - margin.bottom)

// Total-clicks line uses the clicks metric identity color (canonical "blue")
const TOTAL_COLOR = gscMetricColors.clicks.hex

// MergedRow uses split accessors so days with no data can carry forward the
// previous valid split and render in muted gray — without muddling tooltip numbers.
// Real-data days fill brandPct/nonBrandPct; missing days fill brandMuted/nonBrandMuted.
type MergedRow = BrandDataRow & {
  has: boolean
  brandPct: number
  nonBrandPct: number
  brandMuted: number
  nonBrandMuted: number
}

const mergedData = computed<MergedRow[]>(() => {
  let lastBrandPct = 50
  let lastNonBrandPct = 50
  return data.map((row) => {
    const total = row.brand + row.nonBrand
    const has = total > 0
    let brandPct = 0
    let nonBrandPct = 0
    if (has) {
      brandPct = (row.brand / total) * 100
      nonBrandPct = 100 - brandPct
      lastBrandPct = brandPct
      lastNonBrandPct = nonBrandPct
    }
    return {
      ...row,
      has,
      brandPct: has ? brandPct : 0,
      nonBrandPct: has ? nonBrandPct : 0,
      brandMuted: has ? 0 : lastBrandPct,
      nonBrandMuted: has ? 0 : lastNonBrandPct,
    }
  })
})

// Calendar-aware tick planning (compact)
const monthDayFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'short' })

const tickIndices = computed<number[]>(() => {
  const len = data.length
  if (len <= 1)
    return [0]
  if (len <= 35) {
    const step = Math.max(1, Math.ceil(len / 5))
    const out: number[] = []
    for (let i = 0; i < len; i += step) out.push(i)
    if (out[out.length - 1] !== len - 1)
      out.push(len - 1)
    return out
  }
  const out: number[] = []
  let lastMonth = ''
  for (let i = 0; i < len; i++) {
    const m = data[i]?.date.slice(0, 7) ?? ''
    if (m !== lastMonth) {
      out.push(i)
      lastMonth = m
    }
  }
  return out.length >= 2 ? out : [0, Math.floor(len / 2), len - 1]
})

function tickFormat(d: number) {
  const idx = Math.round(d)
  const row = data[idx]
  if (!row?.date)
    return ''
  const date = new Date(row.date)
  return data.length > 35 ? monthFmt.format(date) : monthDayFmt.format(date)
}

// Unstable region — last ~3 days of GSC data are potentially incomplete
const unstableCutoffDate = computed(() => {
  const pstStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' })
  const [y, m, d] = pstStr.split('-').map(Number) as [number, number, number]
  const cutoff = new Date(y, m - 1, d - GSC_STABLE_LATENCY_DAYS)
  return `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`
})
const unstableCount = computed(() => {
  if (!data.length)
    return 0
  const cutoff = unstableCutoffDate.value
  let count = 0
  for (let i = data.length - 1; i >= 0; i--) {
    if ((data[i]?.date ?? '') > cutoff)
      count++
    else break
  }
  return count
})
const unstableWidthPct = computed(() => {
  if (!unstableCount.value || data.length < 2)
    return 0
  return (unstableCount.value - 0.5) / (data.length - 1) * 100
})

const yDomain: [number, number] = [0, 100]

const chartKey = computed(() => {
  const first = data[0]?.date ?? ''
  const last = data[data.length - 1]?.date ?? ''
  return `${data.length}-${first}-${last}`
})

const x = (_d: MergedRow, i: number) => i
// 4 bar accessors stacked in order: real brand, real non-brand, muted brand
// carried-forward, muted non-brand carried-forward. Only one pair is non-zero
// per day so they cleanly replace each other.
const barAccessors = [
  (d: MergedRow) => d.brandPct,
  (d: MergedRow) => d.nonBrandPct,
  (d: MergedRow) => d.brandMuted,
  (d: MergedRow) => d.nonBrandMuted,
]
// color-mix with --ui-bg so identity hex adapts to theme (darker in dark,
// lighter in light). Muted variants blend with bg more heavily → neutral gray.
const barColors = [
  `color-mix(in srgb, ${gscBrandSplitColors.brand.hex} 58%, var(--ui-bg))`,
  `color-mix(in srgb, ${gscBrandSplitColors.nonBrand.hex} 45%, var(--ui-bg))`,
  `color-mix(in srgb, var(--ui-text-dimmed) 35%, var(--ui-bg))`,
  `color-mix(in srgb, var(--ui-text-dimmed) 20%, var(--ui-bg))`,
]

// Total-clicks lines (per-day brand + non-brand) on their own inverted linear scale
// so they span the chart height independently of the [0, 100] percent scale.
// Solid line only renders over real data; dashed line covers gaps and reuses the
// last valid total so the curve stays continuous through no-data days.
const totalAccessor = (d: MergedRow) => (d.has ? d.brand + d.nonBrand : Number.NaN)
const totalDashedAccessor = computed(() => {
  let lastTotal: number | null = null
  const rows = mergedData.value
  const dashed = rows.map((r) => {
    if (r.has) {
      lastTotal = r.brand + r.nonBrand
      return Number.NaN
    }
    return lastTotal ?? Number.NaN
  })
  // Bridge: include the real points adjacent to each gap so solid and dashed meet.
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i]?.has && dashed[i] != null) {
      const prev = rows[i - 1]
      const next = rows[i + 1]
      if (i > 0 && prev?.has)
        dashed[i - 1] = prev.brand + prev.nonBrand
      if (i < rows.length - 1 && next?.has)
        dashed[i + 1] = next.brand + next.nonBrand
    }
  }
  return (_d: MergedRow, i: number) => dashed[i]
})
const totalScale = computed(() => {
  const totals = mergedData.value.filter(r => r.has).map(r => r.brand + r.nonBrand)
  const max = Math.max(...totals, 1)
  return Scale.scaleLinear().domain([0, max * 1.1]).range([chartInnerHeight.value, 0])
})

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

function tooltipTemplate(d: MergedRow | undefined) {
  if (!d)
    return ''
  if (!d.has) {
    return `<div style="padding:8px 10px;font-size:11px;min-width:180px">
      <div style="margin-bottom:4px;font-weight:600;color:var(--ui-text-default)">${dateFmt.format(new Date(d.date))}</div>
      <div style="color:var(--ui-text-muted)">No clicks recorded this day</div>
    </div>`
  }
  const total = d.brand + d.nonBrand
  const brandPct = Math.round((d.brand / total) * 100)
  const nonBrandPct = 100 - brandPct
  return `<div style="padding:8px 10px;font-size:11px;min-width:180px">
    <div style="margin-bottom:6px;font-weight:600;color:var(--ui-text-default)">${dateFmt.format(new Date(d.date))}</div>
    <div style="display:grid;grid-template-columns:auto 1fr auto;gap:4px 8px;align-items:center">
      <span style="width:6px;height:6px;border-radius:50%;background:${TOTAL_COLOR}"></span>
      <span style="color:var(--ui-text-muted)">Total clicks</span>
      <span style="font-weight:600;color:var(--ui-text-default);font-variant-numeric:tabular-nums">${total.toLocaleString()}</span>
      <span style="width:6px;height:6px;border-radius:50%;background:${gscBrandSplitColors.brand.hex}"></span>
      <span style="color:var(--ui-text-muted)">Branded</span>
      <span style="font-weight:600;color:var(--ui-text-default);font-variant-numeric:tabular-nums">${d.brand.toLocaleString()} <span style="color:var(--ui-text-dimmed);font-weight:400">(${brandPct}%)</span></span>
      <span style="width:6px;height:6px;border-radius:50%;background:${gscBrandSplitColors.nonBrand.hex}"></span>
      <span style="color:var(--ui-text-muted)">Non-branded</span>
      <span style="font-weight:600;color:var(--ui-text-default);font-variant-numeric:tabular-nums">${d.nonBrand.toLocaleString()} <span style="color:var(--ui-text-dimmed);font-weight:400">(${nonBrandPct}%)</span></span>
    </div>
  </div>`
}

function crosshairTemplate(d: MergedRow) {
  const idx = mergedData.value.findIndex(r => r.date === d.date)
  const row = idx >= 0 ? mergedData.value[idx] : null
  const isEstimated = unstableCount.value > 0 && idx >= mergedData.value.length - unstableCount.value
  nextTick(() => emit(
    'tooltip',
    row ? { date: row.date, brand: row.brand, nonBrand: row.nonBrand } : null,
    isEstimated,
  ))
  return tooltipTemplate(row ?? undefined)
}

function handleMouseLeave() {
  emit('tooltip', null, false)
}
</script>

<template>
  <div
    data-ui="ProBrandTrafficChart"
    class="brand-chart"
    role="img"
    aria-label="Brand vs non-brand daily composition"
    :style="{ height: `${chartHeight}px` }"
    @mouseleave="handleMouseLeave"
  >
    <div v-if="loading" class="loading-skeleton">
      <div class="flex-1 flex items-end gap-1">
        <UiSkeleton v-for="i in 20" :key="i" type="bar" :index="i" />
      </div>
    </div>

    <template v-else>
      <!-- Unstable data region overlay -->
      <div
        v-if="unstableWidthPct > 0"
        class="estimated-region"
        :style="{ width: `${unstableWidthPct}%`, bottom: `${margin.bottom}px` }"
      >
        <div class="estimated-tint" />
        <div class="estimated-separator" />
      </div>

      <!-- Stacked bars: brand + non-brand = 100% per day -->
      <VisXYContainer
        :key="`bars-${chartKey}`"
        :height="chartHeight"
        :data="mergedData"
        :margin="margin"
        :auto-margin="false"
        class="chart-layer"
        :y-domain="yDomain"
      >
        <VisStackedBar
          :x="x"
          :y="barAccessors"
          :color="barColors"
          :bar-padding="-0.04"
          :rounded-corners="0"
        />
      </VisXYContainer>

      <!-- Total-clicks blue line — own y-scale so its range is independent of the
           bars' [0, 100] percent domain. No :y-domain on container so the line's
           y-scale takes over (mirrors the pattern used by CTR/Position in ProGraphGsc). -->
      <VisXYContainer
        :key="`total-${chartKey}`"
        :height="chartHeight"
        :data="mergedData"
        :margin="margin"
        :auto-margin="false"
        class="chart-layer"
      >
        <!-- Dashed segment first so solid overdraws the bridge endpoints -->
        <VisLine
          curve-type="monotoneX"
          :x="x"
          :y="totalDashedAccessor"
          :y-scale="totalScale"
          :color="TOTAL_COLOR"
          :line-width="1.5"
          :line-dash-array="[4, 3]"
          :opacity="0.55"
        />
        <VisLine
          curve-type="monotoneX"
          :x="x"
          :y="totalAccessor"
          :y-scale="totalScale"
          :color="TOTAL_COLOR"
          :line-width="1.75"
          :opacity="0.85"
        />
      </VisXYContainer>

      <!-- Axis + crosshair (topmost, owns pointer events) -->
      <VisXYContainer
        :key="`interactive-${chartKey}`"
        :height="chartHeight"
        :data="mergedData"
        :margin="margin"
        :auto-margin="false"
        class="chart-layer chart-layer--interactive"
        :y-domain="yDomain"
      >
        <VisLine :x="x" :y="(d: MergedRow) => d.brandPct" color="transparent" :line-width="0" />
        <VisAxis
          type="x"
          :tick-line="false"
          :grid-line="false"
          :domain-line="false"
          :tick-values="tickIndices"
          :tick-format="tickFormat"
          :tick-text-align="TextAlign.Left"
          tick-text-font-size="10px"
          tick-text-color="var(--ui-text-dimmed)"
        />
        <VisTooltip :follow-cursor="false" horizontal-placement="right" />
        <VisCrosshair color="none" :template="crosshairTemplate" />
      </VisXYContainer>
    </template>
  </div>
</template>

<style scoped>
.brand-chart {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
}

.brand-chart .chart-layer,
.brand-chart .loading-skeleton {
  grid-column-start: 1;
  grid-row-start: 1;
}

.brand-chart .chart-layer {
  pointer-events: none;
}

/* Round the top of each stacked bar group — same trick as CwvMetricChart */
.brand-chart :deep(.unovis-stacked-bar-group rect:last-child) {
  rx: 2px;
}

.brand-chart .chart-layer--interactive {
  pointer-events: auto;
  --vis-crosshair-line-stroke-color: var(--ui-border-accented);
  --vis-crosshair-line-stroke-opacity: 0.6;
}

/* Tooltip — pick up theme tokens so it adapts to light/dark automatically */
.brand-chart .chart-layer--interactive :deep(.unovis-tooltip) {
  background: var(--ui-bg-elevated) !important;
  border: 1px solid var(--ui-border) !important;
  border-radius: 8px !important;
  box-shadow: var(--shadow-overlay) !important;
  padding: 0 !important;
  color: var(--ui-text) !important;
}

/* Crispen bar edges so zero-padded bars don't show sub-pixel seams */
.brand-chart :deep(.unovis-stacked-bar-group rect) {
  shape-rendering: crispEdges;
}

.estimated-region {
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
  z-index: 5;
}

.estimated-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent,
    color-mix(in srgb, var(--ui-bg) 60%, transparent) 40%
  );
}

.estimated-separator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: repeating-linear-gradient(
    to bottom,
    var(--ui-text-dimmed) 0,
    var(--ui-text-dimmed) 3px,
    transparent 3px,
    transparent 7px
  );
  opacity: 0.35;
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

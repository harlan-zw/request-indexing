<script lang="ts" setup>
import type { ChartAnnotation, ChartAnnotationOptions } from '../../utils/chartAnnotations'
import type { TopEntityStackBucket, TopEntityStackSeries } from '../../utils/topEntityStack'
import { TextAlign } from '@unovis/ts'
import { VisAxis, VisCrosshair, VisLine, VisStackedBar, VisTooltip, VisXYContainer } from '@unovis/vue'
import { useElementSize } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'
import { ClientOnly, UiChartAnnotations, UiEmptyState, UiSkeleton } from '#components'
import { gscTopEntityColors } from '../../composables/dataVizColors'
import { indexAnnotationsByDay } from '../../utils/chartAnnotations'

// Shared "top N + Other" stacked-bar trend chart (manual-review-2026-08:
// search-console Queries / Pages / Countries). Dumb + presentational — the
// top-N-and-Other bucketing is `bucketTopEntities` (pure, unit-tested); this
// component only draws whatever `buckets`/`series` it's handed. One component,
// three call sites (queries, pages-on-queries-table-view, countries).

interface StackRow { i: number, values: number[] }

const {
  buckets,
  series,
  loading = false,
  height = 220,
  format = (v: number) => v.toLocaleString(),
  xFormat,
  emptyTitle = 'Not enough data to chart',
  emptyDescription = 'This trend fills in once there is more than one day of data.',
  annotations,
  annotationOptions,
} = defineProps<{
  buckets: TopEntityStackBucket[]
  series: TopEntityStackSeries[]
  loading?: boolean
  height?: number | string
  /** Format a metric value for the legend + tooltip. */
  format?: (value: number) => string
  /** Format a bucket's label for the x-axis + tooltip header. Defaults to the bucket's start day, short. */
  xFormat?: (bucket: TopEntityStackBucket) => string
  emptyTitle?: string
  emptyDescription?: string
  annotations?: ChartAnnotation[]
  annotationOptions?: ChartAnnotationOptions
}>()

const emit = defineEmits<{
  annotationEdit: [annotation: ChartAnnotation]
}>()

const chartHeight = computed(() => Number(height) || 220)
const margin = { left: 0, right: 0, top: 4, bottom: 28 }

// gscTopEntityColors is a fixed 11-slot palette (10 identity hues + 1 neutral) —
// topN + Other for the widest caller (the top-10 queries trend), and already
// Tailwind-safelisted (dataVizColors.ts), so no new runtime class needs adding
// here. Other always takes the neutral slot regardless of its position in
// `series`, ranked entities keep their identity hue by rank order. `.hex` feeds
// the SVG marks + the HTML-string crosshair tooltip (neither can resolve a
// Tailwind/CSS-var class); `.dot` (the SOLID identity colour, vs. `.bg`'s
// translucent fill) feeds the real DOM legend swatches.
function colorFor(index: number) {
  return series[index]?.isOther ? gscTopEntityColors.at(-1)! : (gscTopEntityColors[index] ?? gscTopEntityColors.at(-1)!)
}
const resolvedColors = computed(() => series.map((_, i) => colorFor(i).hex))
const resolvedDotClasses = computed(() => series.map((_, i) => colorFor(i).dot))

const rows = computed<StackRow[]>(() => buckets.map((_, i) => ({
  i,
  values: series.map(s => s.values[i] ?? 0),
})))

const y = computed(() => series.map((_, si) => (d: StackRow) => d.values[si] ?? 0))

const yDomain = computed<[number, number]>(() => {
  const max = Math.max(...rows.value.map(r => r.values.reduce((sum, v) => sum + v, 0)), 1)
  return [0, max * 1.1]
})

const x = (_d: StackRow, i: number) => i
const chartKey = computed(() => `${buckets.length}-${series.length}`)

// --- Gapless geometry -------------------------------------------------------
// `barPadding: 0` is NOT enough to make the buckets touch. Unovis sizes a bar as
// `plotWidth / (dataSize + 1)` — it always reserves one extra slot for "possible
// additional domain space" (`stacked-bar/index.js`, `_getBarWidth`) — and then
// insets its range by half a bar at each end, leaving a ~10% gap no padding
// prop can close. Forcing the width to `plotWidth / bucketCount` makes adjacent
// bars meet exactly and puts the outer edges flush with the plot edges.
//
// The interactive overlay then needs the SAME step or the crosshair would sit
// off-centre from the bar it describes: its own line-based scale spreads points
// over `plotWidth / (n - 1)`, which drifts by half a bar by the last bucket.
// A `[-0.5, n - 0.5]` domain gives it step `plotWidth / n` with point `i` at
// `(i + 0.5) * step` — the bar centres.
const plotEl = useTemplateRef<HTMLElement>('plotEl')
const { width: plotWidth } = useElementSize(plotEl)
const barWidth = computed(() => {
  const count = buckets.length
  if (!count || plotWidth.value <= 0)
    return undefined
  return plotWidth.value / count
})
const interactiveXDomain = computed<[number, number]>(() => [-0.5, Math.max(buckets.length - 1, 0) + 0.5])

const defaultDateFmt = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
function bucketLabel(bucket: TopEntityStackBucket): string {
  if (xFormat)
    return xFormat(bucket)
  const d = new Date(`${bucket.start}T00:00:00Z`)
  return Number.isNaN(d.getTime()) ? bucket.start : defaultDateFmt.format(d)
}

function tickFormat(idx: number): string {
  const bucket = buckets[Math.round(idx)]
  return bucket ? bucketLabel(bucket) : ''
}

function crosshairTemplate(d: StackRow): string {
  const bucket = buckets[d.i]
  if (!bucket)
    return ''
  const total = d.values.reduce((sum, v) => sum + v, 0)
  const rowsHtml = series
    .map((s, i) => ({ label: s.label, value: d.values[i] ?? 0, color: resolvedColors.value[i] }))
    .filter(r => r.value > 0)
    .map(r => `<div style="display:flex;align-items:center;gap:6px">
      <span style="width:8px;height:8px;border-radius:9999px;background:${r.color};flex-shrink:0"></span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px;color:var(--ui-text-muted)">${r.label}</span>
      <span style="font-variant-numeric:tabular-nums;color:var(--ui-text-highlighted);margin-left:auto">${format(r.value)}</span>
    </div>`)
    .join('')
  return `<div style="display:flex;flex-direction:column;gap:4px;min-width:180px;padding:2px">
    <div style="display:flex;justify-content:space-between;align-items:center;color:var(--ui-text-dimmed);margin-bottom:2px;font-size:12px">
      <span>${bucketLabel(bucket)}</span>
      <span style="font-weight:600;color:var(--ui-text-highlighted)">${format(total)}</span>
    </div>
    ${rowsHtml}
  </div>`
}

// Day-anchored annotation markers re-anchor onto the bucket index axis by
// matching each annotation's day against a bucket's start day.
const anchoredAnnotations = computed(() =>
  indexAnnotationsByDay(annotations, buckets.map(b => b.start)))
const annotationXDomain = computed<[number, number] | undefined>(() =>
  buckets.length > 1 ? [0, buckets.length - 1] : undefined)

const ariaLabel = computed(() => `Stacked bar chart of ${series.map(s => s.label).join(', ')} over time`)
</script>

<template>
  <div data-ui="UiTopEntityStackChart" class="ui-top-entity-stack-chart min-w-0">
    <!-- Plot area: fixed height, layers grid-stacked. Never grows past `height`
         regardless of series/bucket count — the axis + legend live OUTSIDE this
         box in normal flow so nothing can push the plot taller than its box or
         bleed past the container edge. -->
    <div
      ref="plotEl"
      class="ui-top-entity-stack-chart__plot min-w-0 overflow-hidden"
      role="img"
      :aria-label="ariaLabel"
      :style="{ height: `${chartHeight}px` }"
    >
      <div v-if="loading" class="loading-skeleton">
        <div class="flex-1 flex items-end gap-1">
          <UiSkeleton v-for="i in 16" :key="i" type="bar" :index="i" />
        </div>
      </div>

      <!-- Empty payload is not zero traffic: no buckets/series means we never
           got data, so this must read as "not enough data", never a chart of
           zeros. -->
      <UiEmptyState
        v-else-if="!buckets.length || !series.length"
        compact
        icon="chart-bar"
        :title="emptyTitle"
        :description="emptyDescription"
      />

      <ClientOnly v-else>
        <VisXYContainer
          :key="`bars-${chartKey}`"
          :height="chartHeight"
          :data="rows"
          :margin="margin"
          :auto-margin="false"
          :y-domain="yDomain"
          aria-hidden="true"
          class="chart-layer"
        >
          <!-- Gapless on both axes: buckets butt up against each other and
               segments carry no stroke, so the stack reads as one continuous
               coloured field over time rather than a row of separate bars. -->
          <VisStackedBar :x="x" :y="y" :color="resolvedColors" :bar-padding="0" :bar-width="barWidth" :rounded-corners="0" />
        </VisXYContainer>

        <VisXYContainer
          :key="`interactive-${chartKey}`"
          :height="chartHeight"
          :data="rows"
          :margin="margin"
          :auto-margin="false"
          :y-domain="yDomain"
          :x-domain="interactiveXDomain"
          class="chart-layer chart-layer--interactive"
        >
          <VisLine :x="x" :y="(d: StackRow) => d.values.reduce((s, v) => s + v, 0)" color="transparent" :line-width="0" />
          <VisAxis
            type="x"
            :tick-line="false"
            :grid-line="false"
            :domain-line="false"
            :num-ticks="Math.min(6, buckets.length)"
            :tick-format="tickFormat"
            :tick-text-align="TextAlign.Left"
            tick-text-font-size="11px"
            tick-text-color="var(--ui-text-dimmed)"
          />
          <VisTooltip :follow-cursor="false" horizontal-placement="right" />
          <VisCrosshair color="none" :template="crosshairTemplate" />
        </VisXYContainer>

        <!-- Day-anchored annotation markers (shared overlay; root is position:relative). -->
        <UiChartAnnotations
          :annotations="anchoredAnnotations"
          :x-domain="annotationXDomain"
          :options="annotationOptions"
          @edit="emit('annotationEdit', $event)"
          @interaction-change="() => {}"
        />

        <template #fallback>
          <div class="loading-skeleton">
            <div class="flex-1 flex items-end gap-1">
              <UiSkeleton v-for="i in 16" :key="i" type="bar" :index="i" />
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Legend — normal flow BELOW the plot box, never overlaid on it, so it
         can never crowd or overflow the bars. Always present for 2+ series so
         identity is never color-alone. -->
    <ul
      v-if="series.length > 1 && !loading && buckets.length"
      class="mt-2 flex flex-wrap gap-x-3 gap-y-1"
      :aria-label="`Legend: ${series.map(s => s.label).join(', ')}`"
    >
      <li v-for="(s, i) in series" :key="s.key" class="flex items-center gap-1.5 min-w-0 max-w-full">
        <span class="size-2 rounded-full shrink-0" :class="resolvedDotClasses[i]" aria-hidden="true" />
        <span class="text-mini text-muted truncate">{{ s.label }}</span>
      </li>
    </ul>

    <!-- Screen-reader equivalent of the position-encoded stack (mirrors UiLineChart). -->
    <div v-if="buckets.length" class="sr-only">
      <table>
        <caption>{{ ariaLabel }}</caption>
        <thead>
          <tr>
            <th scope="col">
              Period
            </th>
            <th v-for="s in series" :key="s.key" scope="col">
              {{ s.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(b, i) in buckets" :key="`${b.start}-${b.end}`">
            <th scope="row">
              {{ bucketLabel(b) }}
            </th>
            <td v-for="s in series" :key="s.key">
              {{ format(s.values[i] ?? 0) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.ui-top-entity-stack-chart__plot {
  display: grid;
  grid-template-columns: 1fr;
  position: relative;
  /* No segment stroke: the stack is meant to read as one continuous coloured
     field, and a surface-coloured 2px gap between every band broke it into
     stripes. Bands stay distinguishable by hue + the legend. */
  --vis-stacked-bar-stroke-width: 0;
}

.ui-top-entity-stack-chart__plot .chart-layer,
.ui-top-entity-stack-chart__plot .loading-skeleton {
  grid-column-start: 1;
  grid-row-start: 1;
  min-width: 0;
}

.ui-top-entity-stack-chart__plot .chart-layer {
  pointer-events: none;
}

.ui-top-entity-stack-chart__plot .chart-layer--interactive {
  pointer-events: auto;
  --vis-crosshair-line-stroke-color: var(--ui-border-accented);
  --vis-crosshair-line-stroke-opacity: 0.6;
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

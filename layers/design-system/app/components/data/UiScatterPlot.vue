<script lang="ts" setup generic="T extends ScatterPoint">
import type { VNodeChild } from 'vue'
import { computed } from 'vue'
import { UiSkeleton, UiTooltip } from '#components'
// Bubble scatter plot. Each point is plotted by two percentage coordinates
// (x/y, 0..100 within the plot area) and sized by a third metric, the marker
// drawn as a circle whose inner content is slotted. The canonical "opportunity
// map" surface (reach vs conversion, sized by volume).
//
// Tooltip anchoring: the positioned wrapper sits OUTSIDE the tooltip trigger and
// the sized marker lives inside it. reka's `TooltipTrigger as-child` measures the
// trigger element's box for floating-ui; if the `position:absolute` element were
// the trigger's child (out of flow) the trigger would collapse to zero-size at
// the plot origin and every tooltip would anchor to the top-left corner. Keeping
// the marker in-flow inside an absolutely-positioned wrapper anchors each tooltip
// to its own bubble.

export interface ScatterPoint {
  /** Stable key per point. */
  key: string | number
  /** Horizontal position, 0..100 (% of plot area). */
  x: number
  /** Vertical position, 0..100 (% of plot area). */
  y: number
  /** Marker diameter in px. */
  size: number
  /** Tooltip title. */
  title?: string
  /** Tooltip description. */
  description?: string
}

const {
  points,
  xLabel,
  yLabel,
  midline = false,
  tooltipSide = 'top',
  label,
  loading = false,
} = defineProps<{
  points: T[]
  /** Bottom-right axis caption. */
  xLabel?: string
  /** Left vertical axis caption. */
  yLabel?: string
  /** Draw a faint dashed gridline across the vertical midpoint. */
  midline?: boolean
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
  /** Accessible name for the screen-reader data table (the plot is position-only). */
  label?: string
  /** Swap the markers for placeholder bubbles, keeping the plot chrome. */
  loading?: boolean
}>()

defineSlots<{
  /** Inner marker content (e.g. a flag icon). Receives the full point. */
  marker?: (props: { point: T }) => VNodeChild
}>()

// Placeholder bubbles for `loading`. They render through the SAME positioned
// wrapper (and the same centring translate) as real markers, so the plot box,
// axes and bubble field are already the final layout when data lands — the
// caller can't drift a hand-rolled skeleton out of shape, and a bubble near the
// right edge extends half its diameter, not its full width, past its x.
const LOADING_POINTS = [
  { key: 'l0', x: 12, y: 66, size: 20 },
  { key: 'l1', x: 27, y: 42, size: 34 },
  { key: 'l2', x: 43, y: 55, size: 24 },
  { key: 'l3', x: 58, y: 27, size: 44 },
  { key: 'l4', x: 74, y: 38, size: 28 },
  { key: 'l5', x: 88, y: 18, size: 18 },
]

// The visual plot encodes data by x/y position only, so it is hidden from
// assistive tech; a visually-hidden data table carries the same points as text.
const tableCaption = computed(() => label || [yLabel, xLabel].filter(Boolean).join(' vs ') || 'Plotted data')
</script>

<template>
  <div data-ui="UiScatterPlot" class="relative h-60 select-none" :aria-busy="loading || undefined">
    <!-- Plot area with zero-baseline axes. Position-encoded → hidden from AT;
         the sr-only table below carries the same data. -->
    <div class="absolute inset-x-6 top-2 bottom-7 border-l border-b border-muted" aria-hidden="true">
      <div v-if="midline" class="absolute inset-x-0 top-1/2 border-t border-dashed border-default/40" aria-hidden="true" />
      <!-- Loading: same wrapper + centring as a real marker, so nothing moves
           (or spills past the plot edge) when the points arrive. -->
      <div
        v-for="point in (loading ? LOADING_POINTS : [])"
        :key="`skeleton-${point.key}`"
        class="absolute -translate-x-1/2 -translate-y-1/2"
        :style="{ left: `${point.x}%`, top: `${point.y}%` }"
      >
        <UiSkeleton type="circle" :base="point.size" />
      </div>

      <!-- Positioned wrapper stays OUTSIDE the tooltip trigger so the trigger
           anchors to the marker's real location (see component comment). -->
      <div
        v-for="point in (loading ? [] : points)"
        :key="point.key"
        class="absolute -translate-x-1/2 -translate-y-1/2 hover:z-10"
        :style="{ left: `${point.x}%`, top: `${point.y}%` }"
      >
        <UiTooltip :title="point.title" :description="point.description" :side="tooltipSide">
          <div
            class="flex items-center justify-center rounded-full bg-primary/8 ring-1 ring-primary/15 motion-safe:transition-transform motion-safe:duration-150 motion-safe:hover:scale-110 cursor-default"
            :style="{ width: `${point.size}px`, height: `${point.size}px` }"
          >
            <slot name="marker" :point="point" />
          </div>
        </UiTooltip>
      </div>
    </div>
    <!-- Axis labels -->
    <span v-if="yLabel" class="absolute left-0 top-1 text-mini text-dimmed tabular-nums [writing-mode:vertical-rl] rotate-180" aria-hidden="true">{{ yLabel }}</span>
    <span v-if="xLabel" class="absolute bottom-0 right-6 text-mini text-dimmed" aria-hidden="true">{{ xLabel }}</span>

    <!-- Screen-reader equivalent of the position-only plot. Wrapped in an
         sr-only DIV (not on the table itself): a <table> uses auto table-layout
         that ignores sr-only's width:1px and sizes to content, so the hidden
         table's box would still push horizontal page scroll on mobile. -->
    <div v-if="!loading" class="sr-only">
      <table>
        <caption>{{ tableCaption }}</caption>
        <thead>
          <tr>
            <th scope="col">
              Item
            </th>
            <th scope="col">
              Detail
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="point in points" :key="point.key">
            <td>{{ point.title || '—' }}</td>
            <td>{{ point.description || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

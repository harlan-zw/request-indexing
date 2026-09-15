<script setup lang="ts">
import type { SemanticStatus } from '../../composables/semanticColors'
import { motion, stagger, useReducedMotion } from 'motion-v'
import { computed } from 'vue'
import { semanticColors } from '../../composables/semanticColors'

// One column per CATEGORY, not per period — the categorical sibling of
// UiSparkline, meant as an ambient background for a KPI tile the same way
// UiCwvSparkline is. Each column occupies the full height as a faint track and
// fills the share its value holds of the largest category, so the reader sees a
// shape ("one type dominates" vs "evenly spread") without needing axis labels.
//
// The scale is ZERO-BASED against the max on purpose. UiSparkline's min–max
// projection is right for a trend, where the interesting part is the movement,
// and wrong here: it would paint the smallest category at zero height and read
// as "none of these", which for a distribution is a different claim entirely.

interface Slice {
  label: string
  value: number
  /**
   * Semantic tone for this column. Omit it for the non-event — the colour
   * budget says only the exceptional value takes a hue, so a caller that tones
   * EVERY slice has already lost the signal it was reaching for.
   */
  tone?: SemanticStatus
}

interface Props {
  /** Categories in the order they should be drawn. Caller decides the sort. */
  data: Slice[]
  /** Columns to draw; the remainder is dropped, never silently merged. */
  limit?: number
  width?: number | string
  height?: number | string
  /** SVG preserveAspectRatio — "none" stretches to fill a container. */
  preserveAspectRatio?: string
  /** Bar fill opacity. Moderate, so an enclosing card's value stays dominant. */
  opacity?: number
  /** Hover state, fed from a parent (e.g. the enclosing UiStat card). */
  hovered?: boolean
}

const {
  data,
  limit = 14,
  width = '100%',
  height = '100%',
  preserveAspectRatio = 'none',
  opacity = 0.55,
  hovered = false,
} = defineProps<Props>()

const reduced = useReducedMotion()

const container = {
  rest: {},
  hover: { transition: { delayChildren: stagger(0.04, { ease: 'easeInOut' }) } },
}
const barVariants = {
  rest: { scaleY: 0.82, opacity: 0.85 },
  hover: {
    scaleY: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 190, damping: 16, mass: 0.8 },
  },
}

const vbW = 120
const vbH = 40

function withAlpha(hex: string, a: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const shown = computed(() => data.filter(slice => Number.isFinite(slice.value)).slice(0, limit))

interface Column { x: number, w: number, y: number, h: number, fill: string }

const columns = computed<Column[]>(() => {
  const slices = shown.value
  if (!slices.length)
    return []
  const max = Math.max(...slices.map(slice => slice.value))
  const gap = 0.3
  const slot = vbW / slices.length
  const w = Math.max(0.5, slot * (1 - gap))
  return slices.map((slice, i) => {
    // A zero max would make every share NaN; draw the floor instead.
    const share = max > 0 ? Math.max(0, slice.value) / max : 0
    const h = Math.max(1, share * vbH)
    // Hue carries the severity; it stays under the neutral opacity so the mix
    // reads as a tint on the card, never as a stack of status chips.
    const tone = slice.tone ?? 'neutral'
    return {
      x: i * slot + (slot - w) / 2,
      w,
      y: vbH - h,
      h,
      // A saturated hue at the neutral's opacity shouts; hold the tinted columns
      // well under it so severity reads as a wash, not as a row of alerts.
      fill: withAlpha(semanticColors[tone].hex, tone === 'neutral' ? opacity : opacity * 0.55),
    }
  })
})
const trackFill = computed(() => withAlpha(semanticColors.neutral.hex, opacity * 0.18))

const label = computed(() => shown.value.length
  ? `Issue types by open count: ${shown.value.map(slice => `${slice.label} ${slice.value}`).join(', ')}`
  : 'No issue types')
</script>

<template>
  <svg
    data-ui="UiDistributionBars"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${vbW} ${vbH}`"
    :preserveAspectRatio="preserveAspectRatio"
    role="img"
    :aria-label="label"
  >
    <!-- Full-height tracks: they are what makes a short bar read as a small
         share rather than as a missing category. -->
    <rect
      v-for="(col, i) in columns"
      :key="`track-${i}`"
      :x="col.x"
      :y="0"
      :width="col.w"
      :height="vbH"
      :fill="trackFill"
    />
    <motion.g
      :variants="container"
      initial="rest"
      :animate="hovered && !reduced ? 'hover' : 'rest'"
    >
      <motion.rect
        v-for="(col, i) in columns"
        :key="i"
        :variants="barVariants"
        :x="col.x"
        :y="col.y"
        :width="col.w"
        :height="col.h"
        :fill="col.fill"
        :style="{ transformBox: 'fill-box', transformOrigin: 'bottom' }"
      />
    </motion.g>
  </svg>
</template>

<script setup lang="ts">
import { motion, stagger, useReducedMotion } from 'motion-v'
import { computed } from 'vue'
import { semanticColors } from '../../composables/semanticColors'

// Mini, dependency-free echo of CwvMetricChart: faint good/ni/poor stacked bars
// across time, meant as an ambient background for a KPI tile (the Core Web
// Vitals card). It is decorative — the exact composition does not need to be
// precise — so when no per-period histogram is supplied it synthesises a
// plausible series from the overall `status`. Sibling to UiSparkline.

interface Band { good: number, ni: number, poor: number }

interface Props {
  /** Per-period composition (good/ni/poor percentages, 0–100). Decorative. */
  data?: Band[]
  /** Drives the synthesised series + bar emphasis when `data` is absent. */
  status?: 'pass' | 'ni' | 'fail' | null
  width?: number | string
  height?: number | string
  /** Number of bars when synthesising. */
  bars?: number
  /** SVG preserveAspectRatio — "none" stretches to fill a container. */
  preserveAspectRatio?: string
  /** Base opacity for the bars. Kept moderate so the card value stays dominant
      while the composition reads clearly. */
  opacity?: number
  /** Hover state, fed from a parent (e.g. the enclosing UiStat card). On hover
      the bars rise to full height one by one. */
  hovered?: boolean
}

const {
  data,
  status = null,
  width = '100%',
  height = '100%',
  bars = 22,
  preserveAspectRatio = 'none',
  opacity = 0.6,
  hovered = false,
} = defineProps<Props>()

// Respect reduced-motion: skip the staggered hover rise entirely.
const reduced = useReducedMotion()

// On hover the bars settle up to full height in sequence; at rest they sit a
// touch compressed. scaleY anchored at each bar's base keeps the good/ni/poor
// proportions intact while the whole column rises.
const container = {
  rest: {},
  hover: { transition: { delayChildren: stagger(0.05, { ease: 'easeInOut' }) } },
}
// A smooth spring with a single gentle overshoot — fluid wave up the bars
// rather than a jittery bounce.
const barVariants = {
  rest: { scaleY: 0.72, opacity: 0.85 },
  hover: {
    scaleY: 1,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 190, damping: 16, mass: 0.8 },
  },
}

const vbW = 120
const vbH = 40

// Deterministic wobble (no Math.random — keeps SSR + reloads stable).
function wobble(i: number, amp: number) {
  return (Math.sin(i * 1.3) * 0.5 + Math.sin(i * 0.5) * 0.3 + Math.cos(i * 2.7) * 0.2) * amp
}

const series = computed<Band[]>(() => {
  if (data?.length)
    return data
  // Synthesise a plausible composition trend from the status.
  const base: Band = status === 'pass'
    ? { good: 78, ni: 16, poor: 6 }
    : status === 'fail'
      ? { good: 36, ni: 30, poor: 34 }
      : { good: 56, ni: 31, poor: 13 } // ni / unknown
  return Array.from({ length: bars }, (_, i) => {
    const poor = Math.max(2, base.poor + wobble(i, 8))
    const ni = Math.max(4, base.ni + wobble(i + 7, 6))
    const good = Math.max(0, 100 - poor - ni)
    return { good, ni, poor }
  })
})

function withAlpha(hex: string, a: number): string {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const colors = computed(() => ({
  good: withAlpha(semanticColors.success.hex, opacity),
  ni: withAlpha(semanticColors.warning.hex, opacity),
  poor: withAlpha(semanticColors.error.hex, opacity),
}))

interface Seg { y: number, h: number, fill: string }
interface Bar { x: number, w: number, segs: Seg[] }

const barColumns = computed<Bar[]>(() => {
  const s = series.value
  if (!s.length)
    return []
  const gap = 0.25
  const slot = vbW / s.length
  const w = Math.max(0.5, slot * (1 - gap))
  return s.map((band, i) => {
    const total = band.good + band.ni + band.poor || 1
    const x = i * slot + (slot - w) / 2
    // Stack from the bottom: good → ni → poor (poor sits on top, like CrUX).
    let yTop = vbH
    const stack: [number, string][] = [
      [band.good / total, colors.value.good],
      [band.ni / total, colors.value.ni],
      [band.poor / total, colors.value.poor],
    ]
    const segs: Seg[] = stack.map(([frac, fill]) => {
      const h = frac * vbH
      yTop -= h
      return { y: yTop, h, fill }
    })
    return { x, w, segs }
  })
})
</script>

<template>
  <svg
    data-ui="UiCwvSparkline"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${vbW} ${vbH}`"
    :preserveAspectRatio="preserveAspectRatio"
    role="img"
    aria-label="Core Web Vitals composition"
  >
    <motion.g
      :variants="container"
      initial="rest"
      :animate="hovered && !reduced ? 'hover' : 'rest'"
    >
      <motion.g
        v-for="(bar, i) in barColumns"
        :key="i"
        :variants="barVariants"
        :style="{ transformBox: 'fill-box', transformOrigin: 'bottom' }"
      >
        <rect
          v-for="(seg, j) in bar.segs"
          :key="j"
          :x="bar.x"
          :y="seg.y"
          :width="bar.w"
          :height="seg.h"
          :fill="seg.fill"
        />
      </motion.g>
    </motion.g>
  </svg>
</template>

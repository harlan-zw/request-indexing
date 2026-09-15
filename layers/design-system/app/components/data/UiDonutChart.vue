<script lang="ts" setup generic="T extends Record<string, unknown>">
import { computed } from 'vue'
import { categoricalVizColors } from '../../composables/dataVizColors'

// Donut/pie chart for composition — share of a whole (device split, brand vs non-brand,
// country share). SVG arc ring + a legend with value and percentage per slice. Generic +
// dependency-free, so any row array drives it.

const {
  data,
  labelKey,
  valueKey,
  size = 132,
  colors = categoricalVizColors,
  colorMap,
  centerValue,
  centerLabel,
  label = 'Composition',
  format,
} = defineProps<{
  data: T[]
  /** Row key for the slice label. */
  labelKey: keyof T & string
  /** Row key for the numeric value. */
  valueKey: keyof T & string
  /** Diameter in px. Default 132. */
  size?: number
  /** Ordered design-system chart colours. */
  colors?: readonly string[]
  /** Stable category identity colours keyed by the rendered label. */
  colorMap?: Readonly<Record<string, string>>
  /** Optional dominant takeaway rendered in the ring centre. */
  centerValue?: string | number
  /** Short label beneath the centre value. */
  centerLabel?: string
  /** Accessible caption for the exact semantic legend. */
  label?: string
  /** Format the value in the legend. */
  format?: (value: number) => string
}>()

function num(v: unknown) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/^"+|"+$/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Arc maths against a unit-100 circumference so stroke-dasharray reads as percentages.
const R = 15.9155 // circumference ≈ 100
const C = 2 * Math.PI * R
const palette = computed(() => colors.length ? colors : categoricalVizColors)
const categoryColors = computed(() => {
  const labels = [...new Set(data.map(r => String(r[labelKey] ?? '')))].sort((a, b) => a.localeCompare(b))
  return new Map(labels.map((label, index) => [
    label,
    colorMap?.[label] ?? palette.value[index % palette.value.length]!,
  ]))
})

const segments = computed(() => {
  const items = data
    .map(r => ({ label: String(r[labelKey] ?? ''), value: num(r[valueKey]) }))
    .filter(s => s.value > 0)
    .sort((a, b) => b.value - a.value)
  const total = items.reduce((sum, s) => sum + s.value, 0) || 1
  let acc = 0
  return items.map((s, i) => {
    const pct = (s.value / total) * 100
    const seg = { ...s, color: categoryColors.value.get(s.label) ?? palette.value[i % palette.value.length]!, pct, offset: acc }
    acc += pct
    return seg
  })
})

function fmt(value: number): string {
  return format ? format(value) : value.toLocaleString()
}
</script>

<template>
  <figure data-ui="UiDonutChart" class="flex items-center gap-4">
    <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg
        :width="size"
        :height="size"
        viewBox="0 0 36 36"
        class="-rotate-90"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="18" cy="18" :r="R" fill="none" stroke="var(--ui-bg-muted)" stroke-width="4" />
        <circle
          v-for="(s, i) in segments"
          :key="i"
          data-donut-segment
          cx="18"
          cy="18"
          :r="R"
          fill="none"
          :stroke="s.color"
          stroke-width="4"
          :stroke-dasharray="`${(s.pct / 100) * C} ${C}`"
          :stroke-dashoffset="`${-(s.offset / 100) * C}`"
        />
      </svg>
      <div
        v-if="centerValue != null || centerLabel"
        data-donut-center
        class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
      >
        <span v-if="centerValue != null" class="numerals-display text-heading text-highlighted">{{ centerValue }}</span>
        <span v-if="centerLabel" class="max-w-full truncate text-sm text-muted">{{ centerLabel }}</span>
      </div>
    </div>

    <ul class="min-w-0 flex-1 flex flex-col gap-1 text-sm">
      <li v-for="(s, i) in segments" :key="i" class="flex items-center gap-2">
        <span class="size-2 shrink-0 rounded-full" :style="{ background: s.color }" aria-hidden="true" />
        <span data-donut-label class="flex-1 truncate text-muted" :title="s.label">{{ s.label }}</span>
        <span class="tabular-nums text-highlighted">{{ fmt(s.value) }}</span>
        <span class="w-9 text-right tabular-nums text-muted">{{ s.pct.toFixed(0) }}%</span>
      </li>
    </ul>
    <figcaption class="sr-only">
      {{ label }}
    </figcaption>
  </figure>
</template>

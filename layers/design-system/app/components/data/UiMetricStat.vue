<script lang="ts" setup>
import type { SlotTextOptions } from '../../utils/slot-text'
import { computed } from 'vue'
import { UiIcon, UiSlotText, UiTrend } from '#components'
/**
 * Compact direct-label stat for the card-grid chart area: an optional metric
 * icon, the value, an optional unit label, and a trend delta. Used to label each
 * overview card's chart inline (e.g. "⌖ 16.4K clicks +40%") instead of a
 * separate legend. Shared across every overview tab.
 */
const {
  icon,
  value,
  label,
  trend,
  trendInverted,
  animatedValue = true,
} = defineProps<{
  /** Lucide/registry icon name for the metric. */
  icon?: string
  /** Formatted value (e.g. "16.4K", "94%"). Omit to show only the label + trend
   * (e.g. when the value is already displayed elsewhere, like a chart readout). */
  value?: string
  /** Rolls compact numeric values when they change. */
  animatedValue?: boolean | SlotTextOptions
  /** Unit/metric label (e.g. "clicks"). */
  label?: string
  /** Trend delta; rendered as a UiTrend when non-null. */
  trend?: number | null
  /** Invert trend coloring (lower is better — position, errors, CWV). */
  trendInverted?: boolean
}>()

const animatedValueOptions = computed<SlotTextOptions | null>(() => {
  if (!value || animatedValue === false)
    return null

  const compactMetricValue = /^[+\-$€£¥]?\s*[\d,.]+(?:\s?[kmbt])?(?:\.\d+)?%?$/i.test(value)
  if (typeof animatedValue === 'object')
    return animatedValue

  return compactMetricValue && value.length <= 14
    ? { direction: 'up', duration: 300, stagger: 22 }
    : null
})
</script>

<template>
  <span class="inline-flex items-baseline gap-1.5 min-w-0">
    <UiIcon v-if="icon" :name="icon" class="size-3.5 text-dimmed shrink-0 self-center" aria-hidden="true" />
    <span v-if="value" class="text-sm font-semibold tabular-nums text-default">
      <UiSlotText
        v-if="animatedValueOptions"
        :text="value"
        :options="animatedValueOptions"
      />
      <template v-else>
        {{ value }}
      </template>
    </span>
    <span v-if="label" class="text-xs text-muted truncate" :class="{ 'font-medium text-default': !value }">{{ label }}</span>
    <UiTrend
      v-if="trend != null"
      :value="trend"
      :inverted="trendInverted"
      colored
      format="percent"
      size="2xs"
    />
  </span>
</template>

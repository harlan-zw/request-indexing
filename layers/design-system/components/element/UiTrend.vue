<script setup lang="ts">
import type { TrendDirection, TrendTone } from '~~/layers/design-system/utils/trend'

/**
 * UiTrend
 *
 * Compact delta indicator with arrow + value, sign-coloured against semantic
 * status tokens. Used by TableTrendCell but works standalone anywhere a
 * percentage / numeric delta needs visual weight.
 *
 * `value` is the raw change against the previous period, so `-38` means the
 * number fell by 38%.
 *
 * `inverted` marks a metric where a lower number is better (search position,
 * time-to-first-byte). Arrow, sign and colour are all derived from the same
 * `resolveTrendDelta` result, so an inverted metric that improved reads as an
 * improvement in all three channels.
 */

const {
  value,
  format = 'percent',
  inverted = false,
  size = 'xs',
} = defineProps<{
  value: number
  format?: 'percent' | 'number'
  inverted?: boolean
  size?: '2xs' | 'xs' | 'sm'
}>()

const trend = computed(() => resolveTrendDelta(value, inverted))

const tones: Record<TrendTone, string> = {
  positive: 'text-success',
  negative: 'text-error',
  neutral: 'text-dimmed',
}

const icons: Record<TrendDirection, string> = {
  up: 'i-lucide-arrow-up-right',
  down: 'i-lucide-arrow-down-right',
  flat: 'i-lucide-minus',
}

const sizeClass = computed(() => {
  switch (size) {
    case '2xs': return 'text-[10px]'
    case 'sm': return 'text-sm'
    default: return 'text-xs'
  }
})

const display = computed(() => formatTrendDelta(trend.value, format))

const label = computed(() => trendAriaLabel(trend.value, format, inverted))
</script>

<template>
  <span
    class="inline-flex items-baseline gap-0.5 font-medium tabular-nums whitespace-nowrap"
    :class="[tones[trend.tone], sizeClass]"
    :aria-label="label"
  >
    <UIcon :name="icons[trend.direction]" class="size-3 shrink-0 self-center" aria-hidden="true" />
    {{ display }}
  </span>
</template>

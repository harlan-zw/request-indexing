<script setup lang="ts">
/**
 * UiTrend
 *
 * Compact delta indicator with arrow + value, sign-coloured against semantic
 * status tokens. Used by TableTrendCell but works standalone anywhere a
 * percentage / numeric delta needs visual weight.
 *
 * `inverted` flips success/error so a decrease can read as positive
 * (e.g. ranking position, time-to-first-byte).
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

const direction = computed<'up' | 'down' | 'flat'>(() => {
  if (value === 0)
    return 'flat'
  return (inverted ? -value : value) > 0 ? 'up' : 'down'
})

const tone = computed(() => {
  if (direction.value === 'flat')
    return 'text-dimmed'
  // Direction already accounts for `inverted`; up = good.
  return direction.value === 'up' ? 'text-success' : 'text-error'
})

const icon = computed(() => {
  if (direction.value === 'flat')
    return 'i-lucide-minus'
  return direction.value === 'up' ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-down-right'
})

const sizeClass = computed(() => {
  switch (size) {
    case '2xs': return 'text-[10px]'
    case 'sm': return 'text-sm'
    default: return 'text-xs'
  }
})

const display = computed(() => {
  const abs = Math.abs(value)
  const sign = value > 0 ? '+' : value < 0 ? '-' : ''
  if (format === 'percent')
    return `${sign}${abs}%`
  return `${sign}${abs}`
})
</script>

<template>
  <span
    class="inline-flex items-center gap-0.5 font-medium tabular-nums"
    :class="[tone, sizeClass]"
  >
    <UIcon :name="icon" class="size-3 shrink-0" />
    {{ display }}
  </span>
</template>

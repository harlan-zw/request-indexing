<script lang="ts" setup>
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type BadgeColor = 'success' | 'warning' | 'error'

const props = withDefaults(defineProps<{ value: number | string, size?: BadgeSize }>(), {
  size: 'lg',
})

const val = Number(props.value)
// we're showing the Position metric from Google Search Console, we want to
// alter the colour depending on the position of the keyword
const color = computed<BadgeColor>(() => {
  if (val < 10)
    // border-green-200
    return 'success'
  if (val < 20)
    // border-amber-200
    return 'warning'
  if (val < 30)
    // border-orange-200
    return 'warning'
  // border-red-200
  return 'error'
})
// we should show the value without decimals
const formattedValue = computed(() => Math.round(val))
// it should be shown in a badge with minimal padding

const padding = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-1 py-0.5'
    case 'lg':
      return 'px-2 py-0.5'
    default:
      return 'px-2 py-1'
  }
})

const borderColor = computed(() => ({
  success: 'border-success',
  warning: 'border-warning',
  error: 'border-error',
})[color.value])
</script>

<template>
  <UTooltip :text="`Average position of ${useHumanFriendlyNumber(value)}.`">
    <UBadge :size="size" :color="color" variant="soft" class="border" :class="[padding, borderColor]">
      {{ formattedValue }}
    </UBadge>
  </UTooltip>
</template>

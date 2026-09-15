<script setup lang="ts">
const {
  current,
  previous,
  inverted = false,
  size = '2xs',
  align = 'right',
} = defineProps<{
  current: number | null | undefined
  previous: number | null | undefined
  /** When true, a decrease is treated as positive (e.g. position ranking). */
  inverted?: boolean
  size?: '2xs' | 'xs' | 'sm'
  align?: 'left' | 'center' | 'right'
}>()

// Raw change only. UiTrend owns the `inverted` handling, so applying it here
// too would flip the sign against the arrow and the colour.
const percent = computed(() => {
  if (current == null || !previous)
    return null
  return calcTrendPercent(current, previous)
})

const alignClass = computed(() => align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start')
</script>

<template>
  <div class="flex items-baseline" :class="alignClass">
    <TableDash v-if="percent === null" />
    <UiTrend v-else :value="percent" format="percent" :inverted="inverted" :size="size" />
  </div>
</template>

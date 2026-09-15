<script lang="ts" setup>
/**
 * Enforces one of the three permitted secondary-zone grid layouts.
 *
 * - `equal`: 2-col at lg breakpoint (`grid-cols-1 lg:grid-cols-2 gap-6`)
 * - `wide-narrow`: 3-col with 2:1 split (`lg:grid-cols-3 gap-6`). First child gets `lg:col-span-2`.
 * - `stack`: Full-width vertical stack (`flex flex-col gap-6`)
 *
 * Rule: pick one layout per page zone; never mix grid patterns in the same zone.
 */
const { layout = 'equal' } = defineProps<{
  layout?: 'equal' | 'wide-narrow' | 'stack'
}>()
</script>

<template>
  <div
    v-if="layout === 'stack'"
    class="flex flex-col gap-6"
  >
    <slot />
  </div>
  <div
    v-else-if="layout === 'wide-narrow'"
    class="grid grid-cols-1 lg:grid-cols-3 gap-6 [&>*:first-child]:lg:col-span-2"
  >
    <slot />
  </div>
  <div
    v-else
    class="grid grid-cols-1 lg:grid-cols-2 gap-6"
  >
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
/**
 * Bar-filled metric cell: a relative container with an absolute-positioned bar
 * fill behind slotted content.
 *
 * Keep `barClass` opacity at /10 or above — a /5 fill is invisible against the
 * dashboard's near-black surface, and a bar you can't see isn't a bar.
 */
const { percent, barClass = 'bg-muted/40' } = defineProps<{
  /** Bar fill width as 0-100 */
  percent: number
  /** Tailwind bg class for the bar fill (e.g. from barColorMap or cwvBarColorMap) */
  barClass?: string
}>()

const clampedPercent = computed(() => Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0)))
</script>

<template>
  <div class="relative flex items-center gap-3 px-2 py-1">
    <!-- The fill is presentation only. It stays static across filter changes so
         magnitude does not appear to morph between unrelated populations. -->
    <div
      v-if="clampedPercent > 0"
      class="absolute inset-y-0 left-0 w-full overflow-hidden rounded-md"
    >
      <div
        data-bar-fill
        class="h-full w-full origin-left"
        :class="barClass"
        :style="{ transform: `scaleX(${clampedPercent / 100})` }"
      />
    </div>
    <slot />
  </div>
</template>

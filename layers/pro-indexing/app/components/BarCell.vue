<script lang="ts" setup>
/**
 * Bar-filled metric cell used in SiteGroup tables and ProSitePanel.
 * Renders a relative container with an absolute-positioned bar fill
 * that animates width, plus slotted content on top.
 */
defineProps<{
  /** Bar fill width as 0-100 */
  percent: number
  /** Tailwind bg class for the bar fill (e.g. from barColorMap or cwvBarColorMap) */
  barClass?: string
}>()
</script>

<template>
  <div class="relative flex items-center gap-3 cursor-default px-2 py-1">
    <div
      v-if="percent > 0"
      class="absolute inset-y-0 left-0 rounded-md transition-[width] duration-300"
      :class="barClass"
      :style="{ width: `${percent}%` }"
    />
    <slot />
  </div>
</template>

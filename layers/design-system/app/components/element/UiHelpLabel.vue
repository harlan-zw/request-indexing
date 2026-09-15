<script setup lang="ts">
import { UiIcon, UiTooltip } from '#components'
/**
 * UiHelpLabel
 *
 * Label text with an inline (?) help icon that shows a tooltip on hover.
 * Used by UiStat, UiDataList, and anywhere a title needs contextual help.
 */
const { text, tooltip, tooltipTitle } = defineProps<{
  text: string
  tooltip: string
  /** Bold title in tooltip panel. Defaults to `text`. */
  tooltipTitle?: string
}>()
</script>

<template>
  <UiTooltip :title="tooltipTitle || text" :description="tooltip" trigger-as="button">
    <span class="inline-flex items-center gap-1">
      {{ text }}
      <UiIcon name="help" class="size-3 opacity-50 shrink-0" aria-hidden="true" />
    </span>
  </UiTooltip>
</template>

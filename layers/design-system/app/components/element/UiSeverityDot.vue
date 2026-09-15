<script setup lang="ts">
import type { SemanticStatus } from '../../composables/semanticColors'
import { semanticColors } from '../../composables/semanticColors'

const { severity = 'neutral', label } = defineProps<{
  severity?: SemanticStatus
  label?: string
}>()

// When the caller supplies neither a label nor slot content, severity is left to
// the dot colour alone — give screen readers the severity word as a fallback.
const SEVERITY_WORD: Record<SemanticStatus, string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
  success: 'Success',
  neutral: 'Neutral',
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 text-xs text-default w-auto">
    <span class="size-1.5 rounded-full shrink-0" :class="semanticColors[severity].dot" aria-hidden="true" />
    <slot>{{ label }}</slot>
    <span v-if="!label && !$slots.default" class="sr-only">{{ SEVERITY_WORD[severity] }}</span>
  </span>
</template>

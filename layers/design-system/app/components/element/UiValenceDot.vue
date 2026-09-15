<script setup lang="ts">
import type { SemanticStatus } from '../../composables/semanticColors'
import { semanticColors } from '../../composables/semanticColors'

// Valence is the change-direction axis — the sibling of severity (UiSeverityDot)
// and health (UiHealthDot). A leading dot is the canonical treatment for
// direction in a repeated list (DESIGN.md colour budget); a coloured left-border
// stripe is the banned alternative. A flat / no-change reading is a non-event, so
// it stays neutral rather than spending colour.
const { direction = 'flat', size = 'sm', label } = defineProps<{
  direction?: 'up' | 'down' | 'flat'
  size?: 'xs' | 'sm' | 'md'
  /**
   * Accessible name for the dot. Pass when it stands alone (no adjacent text), so
   * colour is not the only channel conveying valence. Omit when a visible label
   * sits beside it — the dot stays decorative then.
   */
  label?: string
}>()

const DIRECTION_STATUS: Record<'up' | 'down' | 'flat', SemanticStatus> = {
  up: 'success',
  down: 'error',
  flat: 'neutral',
}
const sizeClass = { xs: 'size-1', sm: 'size-1.5', md: 'size-2' } as const
</script>

<template>
  <span
    class="rounded-full shrink-0"
    :class="[sizeClass[size], semanticColors[DIRECTION_STATUS[direction]].dot]"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  />
</template>

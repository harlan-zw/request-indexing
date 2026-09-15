<script setup lang="ts">
import { computed } from 'vue'
import { UiTableDash } from '#components'

type Status = 'good' | 'ni' | 'poor' | 'neutral'

const {
  value,
  display,
  status = 'neutral',
  muted = false,
  align = 'right',
} = defineProps<{
  value: number | null | undefined
  /** Pre-formatted display string. If omitted, value is rendered as-is via String(). */
  display?: string | null
  /** Optional status colour token (e.g. CWV good/needs-improvement/poor). */
  status?: Status
  /** Render in muted secondary tone (e.g. impressions vs primary clicks). */
  muted?: boolean
  align?: 'left' | 'center' | 'right'
}>()

const isNullish = computed(() => value == null || display === null)

// Color rides the failure, never the pass. A table of green "good" values spends
// the page's color budget on non-events, so the one failing row can't stand out
// (DESIGN — Color budget). `good` reads as a plain numeral; the aria-label still
// carries the word for anyone who can't see the hue at all.
const statusClass: Record<Status, string> = {
  good: '',
  ni: 'text-warning',
  poor: 'text-error',
  neutral: '',
}

const statusLabel: Record<Status, string | undefined> = {
  good: 'Good',
  ni: 'Needs improvement',
  poor: 'Poor',
  neutral: undefined,
}

const alignClass = computed(() => align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start')

const ariaLabel = computed(() => {
  const label = statusLabel[status]
  if (!label || !display)
    return undefined
  return `${display}, ${label}`
})
</script>

<template>
  <div
    class="flex items-center gap-2"
    :class="[$slots.trend ? 'flex-col items-stretch gap-1' : '', alignClass]"
  >
    <UiTableDash v-if="isNullish" />
    <span
      v-else
      class="numerals-display text-sm"
      :class="[
        statusClass[status],
        muted && status === 'neutral' ? 'text-muted' : 'font-medium',
      ]"
      :aria-label="ariaLabel"
    >{{ display ?? String(value) }}</span>
    <slot v-if="!isNullish" name="trend" />
    <slot v-if="!isNullish" name="after" />
  </div>
</template>

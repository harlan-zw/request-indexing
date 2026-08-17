<script setup lang="ts">
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

const isNullish = computed(() => value == null || value === 0 || display === null)

const statusClass: Record<Status, string> = {
  good: 'text-success',
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
  <!-- Value and delta share one baseline and the delta keeps a fixed track, so a
       column of metric cells scans as a column instead of drifting per row. -->
  <div
    class="flex items-baseline gap-2 whitespace-nowrap"
    :class="alignClass"
  >
    <TableDash v-if="isNullish" />
    <span
      v-else
      class="font-mono text-sm tabular-nums"
      :class="[
        statusClass[status],
        muted && status === 'neutral' ? 'text-muted' : 'font-medium',
      ]"
      :aria-label="ariaLabel"
    >{{ display ?? String(value) }}</span>
    <span v-if="!isNullish && $slots.trend" class="inline-flex shrink-0 justify-end min-w-14">
      <slot name="trend" />
    </span>
    <slot v-if="!isNullish" name="after" />
  </div>
</template>

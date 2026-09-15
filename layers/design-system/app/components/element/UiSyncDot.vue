<script lang="ts" setup>
import { computed } from 'vue'
/**
 * Sync status indicator: pulsing dot + optional label.
 * Replaces repeated inline sync dot markup across SiteGroup components.
 *
 * - 'syncing' → blue pulse (bg-info)
 * - 'error' / 'failed' → red, solid (bg-error, no pulse — it is not in progress)
 * - 'pending' / other -> muted pulse
 */
const { status, label, size = '1.5' } = defineProps<{
  status?: 'syncing' | 'pending' | 'error' | string | null
  label?: string
  size?: '1.5' | '2'
}>()

const sizeClass = { 1.5: 'size-1.5', 2: 'size-2' } as const

const isError = computed(() => status === 'error' || status === 'failed')
const dotClass = computed(() => [
  sizeClass[size],
  isError.value ? 'bg-error' : status === 'syncing' ? 'bg-info' : 'bg-accented',
  // An error is a resting state, not progress, so it should not pulse.
  isError.value ? '' : 'motion-safe:animate-pulse',
])
const ariaLabel = computed(() => isError.value ? 'Sync error' : status === 'syncing' ? 'Syncing' : 'Sync pending')
</script>

<template>
  <div v-if="label" class="flex items-center gap-2">
    <span
      class="rounded-full shrink-0"
      :class="dotClass"
      aria-hidden="true"
    />
    <span class="text-xs tabular-nums" :class="isError ? 'text-error' : 'text-muted'">{{ label }}</span>
    <slot />
  </div>
  <span
    v-else
    class="rounded-full shrink-0"
    :class="dotClass"
    role="img"
    :aria-label="ariaLabel"
  />
</template>

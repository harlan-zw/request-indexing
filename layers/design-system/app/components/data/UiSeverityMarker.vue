<script setup lang="ts">
const { severity } = defineProps<{
  severity: 'error' | 'warning' | 'info'
}>()

const SEVERITY_WORD: Record<'error' | 'warning' | 'info', string> = {
  error: 'High',
  warning: 'Medium',
  info: 'Low',
}
</script>

<template>
  <span
    class="flex h-5 w-2 shrink-0 items-center justify-center"
    role="img"
    :aria-label="`${SEVERITY_WORD[severity]} severity`"
    :title="`${SEVERITY_WORD[severity]} severity`"
  >
    <!-- A custom path keeps the 8px triangle soft without adding icon detail. -->
    <svg v-if="severity === 'error'" viewBox="0 0 8 8" class="size-2 text-error" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 .6c.23 0 .43.12.55.33l3.07 5.32c.24.42-.06.95-.54.95H.92c-.48 0-.78-.53-.54-.95L3.45.93A.63.63 0 0 1 4 .6Z"
      />
    </svg>
    <span v-else-if="severity === 'warning'" class="size-1.5 rotate-45 rounded-[1px] border border-warning" aria-hidden="true" />
    <span v-else class="size-1.5 rounded-full border border-[var(--ui-text-dimmed)]" aria-hidden="true" />
  </span>
</template>

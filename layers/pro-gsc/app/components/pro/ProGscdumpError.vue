<script setup lang="ts">
import type { GscdumpError } from '#layers/pro-gsc/app/composables/_gscdump-error'

const props = defineProps<{
  error: GscdumpError | Error | null
  compact?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

// Normalize error to GscdumpError format
const normalizedError = computed<GscdumpError | null>(() => {
  if (!props.error)
    return null

  // Already a GscdumpError
  if ('code' in props.error)
    return props.error as GscdumpError

  // Standard Error - convert to GscdumpError
  const err = props.error as Error & { status?: number, statusCode?: number }
  const status = err.status || err.statusCode
  if (status === 401 || status === 403)
    return { message: 'Authentication failed', code: 'AUTH', status, retry: false }
  if (status === 429)
    return { message: 'Rate limited', code: 'RATE_LIMIT', status, retry: true }
  if (status && status >= 500)
    return { message: 'Server error', code: 'SERVER', status, retry: true }

  return { message: err.message || 'An error occurred', code: 'UNKNOWN', retry: true }
})

const errorCodeToSemantic: Record<string, SemanticStatus> = {
  AUTH: 'warning',
  NETWORK: 'warning',
  RATE_LIMIT: 'info',
  NOT_FOUND: 'neutral',
}

const errorIcons: Record<string, string> = {
  AUTH: 'i-lucide-key',
  NETWORK: 'i-lucide-wifi-off',
  RATE_LIMIT: 'i-lucide-clock',
  NOT_FOUND: 'i-lucide-search-x',
}

const errorConfig = computed(() => {
  if (!normalizedError.value)
    return null
  const code = normalizedError.value.code ?? 'UNKNOWN'
  const status = errorCodeToSemantic[code] ?? 'error'
  const colors = semanticColors[status]
  return { icon: errorIcons[code] ?? 'i-lucide-alert-circle', color: colors.text, bg: colors.bg }
})
</script>

<template>
  <div v-if="normalizedError" class="flex flex-col items-center justify-center py-8 px-4" :class="compact ? 'py-4' : 'py-8'">
    <div
      class="size-12 rounded-2xl flex items-center justify-center mb-3"
      :class="[errorConfig?.bg, compact && 'size-10 mb-2']"
    >
      <UIcon :name="errorConfig?.icon || 'i-lucide-alert-circle'" class="size-6" :class="[errorConfig?.color, compact && 'size-5']" />
    </div>
    <p class="text-sm font-medium text-center mb-1" :class="compact && 'text-xs'">
      {{ normalizedError.message }}
    </p>
    <UButton
      v-if="normalizedError.retry"
      size="xs"
      variant="ghost"
      color="neutral"
      icon="i-lucide-refresh-cw"
      :class="compact ? 'mt-1' : 'mt-2'"
      @click="emit('retry')"
    >
      Retry
    </UButton>
    <NuxtLink
      v-else-if="normalizedError.code === 'AUTH'"
      to="/pro/dashboard/settings"
      class="text-xs text-primary hover:underline mt-2"
    >
      Reconnect account
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { UiIcon as UiIconName } from '../../shared/ui-icons'
import type { WidgetFailure } from '../../shared/widget-failure'
import { computed, onMounted, ref } from 'vue'
import { UiButton, UiEmptyState, UiIcon, UiSkeleton } from '#components'
import { toWidgetFailure, WIDGET_FAILURE_COPY } from '../../shared/widget-failure'

const {
  status,
  error,
  empty,
  skeletonLines = 5,
  skeletonType = 'text',
  emptyIcon = 'inbox',
  emptyTitle = 'No data',
  emptyMessage = 'There is no data to display',
  showLoadingBeforeHydration = false,
} = defineProps<{
  status: 'idle' | 'pending' | 'success' | 'error'
  /**
   * The caught value, for classification only. Typed `unknown` on purpose: the
   * template can read no string off it, so a wire message has no route to the
   * screen. Pass the raw query error — wrapping it in `new Error(humanCopy)`
   * throws away the status code this needs and buys nothing.
   */
  error?: unknown
  empty?: boolean
  skeletonLines?: number
  skeletonType?: 'text' | 'bar' | 'circle'
  emptyIcon?: UiIconName
  emptyTitle?: string
  emptyMessage?: string
  /**
   * Render a deterministic loading slot during SSR and hydration. Use only for
   * explicitly client-only reads whose payload cannot resolve before hydration.
   */
  showLoadingBeforeHydration?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()

defineSlots<{
  default?: () => unknown
  loading?: () => unknown
  empty?: () => unknown
  error?: (props: { failure: WidgetFailure, retry: () => void }) => unknown
}>()

// Suppress loading skeletons until after hydration so server and client
// render the same branch. Lazy fetches transfer data via the SSR payload,
// making status jump from pending→success between render and hydrate.
const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})
const isLoading = computed(() => (showLoadingBeforeHydration || hydrated.value) && (status === 'pending' || status === 'idle'))
// `status` alone decides the branch. It used to also require a truthy `error`,
// which meant a caller that mapped its own failure to `status="error"` without
// threading an error object fell past this branch AND past the empty branch,
// into the default slot: a heading over an empty box. Half the call sites did
// exactly that, so the error object is no longer a gate.
const isError = computed(() => status === 'error')
const isEmpty = computed(() => status === 'success' && empty)
const failure = computed(() => toWidgetFailure(error))
const failureCopy = computed(() => WIDGET_FAILURE_COPY[failure.value._tag])
</script>

<template>
  <div data-ui="UiWidgetState" :aria-busy="isLoading">
    <slot v-if="isLoading" name="loading">
      <span class="sr-only" role="status" aria-live="polite">Loading…</span>
      <UiSkeleton v-if="skeletonType === 'text'" :lines="skeletonLines" />
      <div v-else-if="skeletonType === 'bar'" class="flex items-end gap-1 h-40">
        <UiSkeleton v-for="i in skeletonLines" :key="i" type="bar" :index="i" />
      </div>
      <UiSkeleton v-else type="circle" :base="skeletonLines" />
    </slot>
    <slot v-else-if="isError" name="error" :failure="failure" :retry="() => emit('retry')">
      <div class="flex flex-col items-center justify-center py-8 px-4 text-center" role="alert">
        <div class="size-10 rounded-xl bg-error/10 flex items-center justify-center mb-3">
          <UiIcon name="caution" class="size-5 text-error" aria-hidden="true" />
        </div>
        <p class="text-sm font-medium text-default mb-1">
          {{ failureCopy.title }}
        </p>
        <p class="text-xs text-muted mb-3 max-w-xs text-balance">
          {{ failureCopy.body }}
        </p>
        <UiButton v-if="failureCopy.retryable" size="xs" purpose="secondary" icon="refresh" @click="emit('retry')">
          Retry
        </UiButton>
      </div>
    </slot>
    <slot v-else-if="isEmpty" name="empty">
      <UiEmptyState :icon="emptyIcon" :title="emptyTitle" :description="emptyMessage" compact />
    </slot>
    <slot v-else />
  </div>
</template>

<script setup lang="ts">
import type { ErrorStateSource } from '../../shared/error-state'
import { computed } from 'vue'
import { UiAlert, UiButton } from '#components'
import { resolveErrorState } from '../../shared/error-state'

const { error } = defineProps<{
  /**
   * Why the region failed, and where the words come from.
   *
   * Build it with `wireError(caught)` for a caught value, `errorCopy(...)` for
   * a sentence a person wrote, or `rateLimited(...)` for a parsed quota
   * refusal. A caught error has no renderable string here: `wireError` types it
   * `unknown`, so the template reads only its HTTP status code and states copy
   * this component owns. The old `string | { message: string }` prop rendered
   * the caught message, which quotes the request URL.
   */
  error: ErrorStateSource | null
  /** Optional retry handler. When set (and no #action slot), renders a "Try again" button. */
  onRetry?: () => void
}>()

defineSlots<{
  /** Replaces the retry button and the generic next-step line. */
  action?: () => unknown
}>()

// `Date.now()` is read once per resolve, the same as the old inline reset
// maths. The reset hint counts down only when something else re-renders.
const view = computed(() => error ? resolveErrorState(error, Date.now()) : null)
</script>

<template>
  <UiAlert
    v-if="view"
    :status="view.tone"
    :icon="view.icon"
    :title="view.title"
    class="mb-8"
  >
    <p v-if="view.detail" class="mt-1">
      {{ view.detail }}
    </p>
    <p
      v-if="view.nextStep && (view.nextStep._tag === 'timing' || !$slots.action)"
      class="text-muted/80 mt-1"
    >
      {{ view.nextStep.text }}
    </p>
    <slot name="action" />
    <UiButton
      v-if="onRetry && view.retryable && !$slots.action"
      purpose="secondary"
      size="xs"
      icon="refresh"
      label="Try again"
      class="mt-2"
      @click="onRetry()"
    />
  </UiAlert>
</template>

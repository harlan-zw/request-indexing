<script setup lang="ts">
import { computed } from 'vue'
import { UiChip, UiIcon } from '#components'

const {
  title,
  description,
  icon,
  count = null,
  status = 'success',
  empty = false,
  emptyLabel,
  loadingLabel = 'Loading...',
  errorLabel = 'Could not load this panel.',
  hideWhenEmpty = true,
} = defineProps<{
  title: string
  description?: string
  icon?: string
  count?: string | number | null
  status?: 'pending' | 'success' | 'error'
  empty?: boolean
  emptyLabel?: string
  loadingLabel?: string
  errorLabel?: string
  hideWhenEmpty?: boolean
}>()

const shouldRender = computed(() =>
  status !== 'success' || !empty || !!emptyLabel || !hideWhenEmpty,
)
</script>

<template>
  <section
    v-if="shouldRender"
    class="group/rail min-w-0 overflow-hidden rounded-lg border border-default bg-elevated/45 transition-colors hover:bg-elevated/60"
    :aria-label="title"
    :aria-busy="status === 'pending' ? 'true' : undefined"
  >
    <header class="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-default/80 px-3.5 py-2.5">
      <div class="flex min-w-0 items-center gap-2">
        <span
          v-if="icon"
          class="flex size-6 shrink-0 items-center justify-center rounded-md border border-default bg-default text-dimmed"
          aria-hidden="true"
        >
          <UiIcon :name="icon" class="size-3.5" />
        </span>
        <span class="min-w-0">
          <h3 class="min-w-0 truncate text-sm font-medium text-highlighted">
            {{ title }}
          </h3>
          <p v-if="description" class="mt-0.5 truncate text-mini text-dimmed">
            {{ description }}
          </p>
        </span>
      </div>

      <div class="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-2">
        <slot name="meta" />
        <UiChip
          v-if="count != null && count !== 0"
          purpose="count"
          size="xs"
          tabular
        >
          {{ count }}
        </UiChip>
      </div>
    </header>

    <slot v-if="status === 'pending'" name="loading">
      <div class="px-4 py-6 text-sm text-dimmed">
        {{ loadingLabel }}
      </div>
    </slot>

    <slot v-else-if="status === 'error'" name="error">
      <div class="px-4 py-6 text-sm text-dimmed">
        {{ errorLabel }}
      </div>
    </slot>

    <slot v-else-if="empty" name="empty">
      <div v-if="emptyLabel" class="px-4 py-5 text-sm text-dimmed">
        {{ emptyLabel }}
      </div>
    </slot>

    <slot v-else />
  </section>
</template>

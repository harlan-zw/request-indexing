<script setup lang="ts">
import type { UiIcon as UiIconName } from '../../shared/ui-icons'
import { m, useReducedMotion } from 'motion-v'
import { computed } from 'vue'
import { UiAtmosphere, UiIcon } from '#components'
import { entrancePresets, entranceProps } from '../../shared/motion'

const {
  compact,
  headingTag = 'h3',
  animated = true,
} = defineProps<{
  icon: UiIconName
  title: string
  description?: string
  compact?: boolean
  headingTag?: 'h1' | 'h2' | 'h3'
  /** Disable JS entrance motion on SSR-sensitive public routes. */
  animated?: boolean
  /**
   * Opt-in greydient atmosphere for genuine pre-data / front-door empty states
   * (a preset name). Full variant only — leave unset for in-dashboard empties so
   * data surfaces stay silent. Renders behind the content via <UiAtmosphere>.
   */
  atmosphere?: 'front-door' | 'error' | 'ai' | 'preview' | 'share'
}>()

const reduced = useReducedMotion()
const rootComponent = computed(() => animated ? m.div : 'div')
const rootMotion = computed(() => animated ? entranceProps(entrancePresets.fadeUp, reduced.value) : {})
</script>

<template>
  <component
    :is="rootComponent"
    data-testid="empty-state"
    :class="compact
      ? 'flex flex-col items-center justify-center h-[220px] rounded-lg border border-dashed border-default bg-muted'
      : ['text-center py-16 min-h-[400px] flex flex-col items-center justify-center', atmosphere ? 'relative isolate overflow-hidden' : '']"
    v-bind="rootMotion"
  >
    <!-- Compact: inline empty state for cards/lists -->
    <template v-if="compact">
      <UiIcon :name="icon" class="size-8 text-dimmed mb-2" aria-hidden="true" />
      <p class="text-sm font-medium text-default">
        {{ title }}
      </p>
      <p v-if="description" class="text-xs text-muted mt-1 max-w-sm text-center px-4">
        {{ description }}
      </p>
      <div v-if="$slots.default" class="mt-3 [&_button]:min-h-11 [&_a]:min-h-11 sm:[&_button]:min-h-0 sm:[&_a]:min-h-0">
        <slot />
      </div>
    </template>

    <!-- Full: centered page-level empty state -->
    <template v-else>
      <!-- z-index:-1 + isolate keeps it behind content without wrapping anything. -->
      <UiAtmosphere v-if="atmosphere" :preset="atmosphere" style="z-index: -1" />
      <div class="inline-flex items-center justify-center size-14 rounded-2xl bg-elevated border border-default mb-4">
        <UiIcon :name="icon" class="size-7 text-muted" aria-hidden="true" />
      </div>
      <component :is="headingTag" class="text-lg font-medium text-default mb-1">
        {{ title }}
      </component>
      <p v-if="description" class="text-sm text-muted max-w-md mx-auto leading-relaxed">
        {{ description }}
      </p>
      <div class="mt-6 [&_button]:min-h-11 [&_a]:min-h-11 sm:[&_button]:min-h-0 sm:[&_a]:min-h-0">
        <slot />
      </div>
      <slot name="footer" />
    </template>
  </component>
</template>

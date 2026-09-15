<script setup lang="ts">
import { UiFocusedSurface } from '#components'
// Guided-onboarding wizard chrome: the focused surface (UiFocusedSurface), a
// `#logo` slot for the product mark, and a centered max-w-2xl content column.
// Step content + progress + nav go in the default slot.
//
// Height falls through to the surface (attrs): the live page passes
// `min-h-screen`; an embedded preview passes a fixed height.
const {
  exitLabel = 'Dashboard',
  showExit = true,
  as = 'main',
  wide = false,
} = defineProps<{
  exitLabel?: string
  showExit?: boolean
  as?: string
  wide?: boolean
}>()
const emit = defineEmits<{ exit: [] }>()
</script>

<template>
  <UiFocusedSurface :as="as" align="top" :exit-label="exitLabel" :show-exit="showExit" @exit="emit('exit')">
    <div class="w-full mx-auto mt-10 md:mt-16 relative z-10" :class="wide ? 'max-w-6xl' : 'max-w-2xl'">
      <div class="flex items-center gap-1 mb-8 [&>span]:!ml-0">
        <slot name="logo" />
        <!-- Account affordance for a wizard with no exit link (first-run
             onboarding): the user must always be able to see who they are
             signed in as and get out. Filled by the consumer — this layer
             can't reach the session. -->
        <div v-if="$slots.account" class="ml-auto flex items-center gap-1">
          <slot name="account" />
        </div>
      </div>
      <slot />
    </div>
  </UiFocusedSurface>
</template>

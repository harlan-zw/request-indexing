<script setup lang="ts">
import type { Transition } from 'motion-v'
import type { UiIcon as UiIconName } from '../../shared/ui-icons'
import { m, useReducedMotion } from 'motion-v'
import { UiAtmosphere, UiIcon } from '#components'
import { entrancePresets, entranceProps } from '../../shared/motion'

// The "spark joy" moment (DESIGN principle 8): a success / milestone reveal — a
// site connected, a trial started. This is the ONE place a
// component defaults to atmosphere (a Dawn bloom = first light), because it is
// exclusively a celebratory edge, never a data surface. Restraint: the joy is the
// bloom + a single quiet spring on reveal, NOT confetti. Reduced-motion safe.
const {
  icon,
  palette = 'dawn',
  title,
  description,
} = defineProps<{
  /** Optional small mark above the title (a single monochrome-container icon, primary glyph). */
  icon?: UiIconName
  /** Atmosphere palette — Dawn (first light) by default; Dusk for a premium/paid moment. */
  palette?: 'ink' | 'twilight' | 'dawn' | 'dusk' | 'mist' | 'ash'
  title: string
  description?: string
}>()

const reduced = useReducedMotion()

// A gentle overshoot — the sanctioned celebratory spring (subtle, no anticipation).
const medallionPop = { type: 'spring', stiffness: 300, damping: 14, mass: 0.8 } satisfies Transition
</script>

<template>
  <div class="relative isolate overflow-hidden flex flex-col items-center text-center px-6 py-12">
    <UiAtmosphere :palette="palette" geometry="bloom" intensity="present" style="z-index: -1" />

    <!-- Icon springs in once (a quiet overshoot), then stands still. -->
    <m.div
      v-if="icon"
      class="inline-flex items-center justify-center size-12 rounded-2xl bg-elevated border border-default mb-5"
      :initial="reduced ? false : { opacity: 0, scale: 0.8 }"
      :animate="{ opacity: 1, scale: 1 }"
      :transition="reduced ? { duration: 0 } : medallionPop"
    >
      <UiIcon :name="icon" class="size-6 text-primary" aria-hidden="true" />
    </m.div>

    <m.h2
      class="text-2xl font-display font-semibold tracking-tight text-highlighted"
      v-bind="entranceProps(entrancePresets.fadeUp, reduced)"
    >
      {{ title }}
    </m.h2>
    <m.p
      v-if="description"
      class="text-sm text-muted mt-2 max-w-md leading-relaxed"
      v-bind="entranceProps(entrancePresets.fadeUp, reduced)"
    >
      {{ description }}
    </m.p>

    <div v-if="$slots.default" class="relative mt-6 [&_button]:min-h-11 [&_a]:min-h-11 sm:[&_button]:min-h-0 sm:[&_a]:min-h-0">
      <slot />
    </div>
  </div>
</template>

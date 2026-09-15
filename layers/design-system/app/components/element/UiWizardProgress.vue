<script setup lang="ts">
import { UiIcon } from '#components'
// Numbered progress rail for the guided-onboarding wizard. Completed steps show
// a check, the current step is ringed, future steps recede.
//
// Future steps sit at `text-muted`, not `text-dimmed`: these are chrome labels,
// and dimmed measures 3.6–4.2:1 in dark on every surface (DESIGN.md, Contrast &
// Accessibility) — below AA at any size. The step you're on already carries the
// weight + ring, so it stays distinct without pushing the rest under AA.
defineProps<{
  steps: { id: string, label: string }[]
  currentIndex: number
}>()

const emit = defineEmits<{ select: [id: string] }>()
</script>

<template>
  <nav aria-label="Onboarding progress">
    <p
      class="sm:hidden text-sm font-medium text-highlighted"
      aria-current="step"
    >
      Step {{ currentIndex + 1 }} of {{ steps.length }}:
      {{ steps[currentIndex]?.label }}
    </p>

    <ol class="mt-3 flex items-center gap-1.5 sm:mt-0 sm:gap-2">
      <li
        v-for="(s, i) in steps"
        :key="s.id"
        class="flex items-center gap-2"
        :aria-current="i === currentIndex ? 'step' : undefined"
      >
        <button
          v-if="i < currentIndex"
          type="button"
          class="group inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-1 text-muted outline-none transition-colors hover:text-default focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0"
          :aria-label="`Return to ${s.label}`"
          @click="emit('select', s.id)"
        >
          <span class="inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-inverted transition-transform group-hover:scale-105">
            <UiIcon name="check" class="size-3" aria-hidden="true" />
          </span>
          <span class="hidden text-sm sm:inline">{{ s.label }}</span>
        </button>
        <span v-else class="inline-flex min-h-11 items-center gap-2 px-1 sm:min-h-0">
          <span
            class="inline-flex size-5 items-center justify-center rounded-full text-xs font-medium transition-colors"
            :class="i === currentIndex ? 'bg-primary/15 text-primary ring-1 ring-primary/30' : 'bg-elevated text-muted'"
          >
            {{ i + 1 }}
          </span>
          <span
            class="hidden text-sm sm:inline"
            :class="i === currentIndex ? 'text-highlighted font-medium' : 'text-muted'"
          >{{ s.label }}</span>
        </span>
        <span v-if="i < steps.length - 1" class="h-px w-3 bg-accented sm:w-4 lg:w-6" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>

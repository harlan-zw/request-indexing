<script setup lang="ts">
import { UiButton } from '#components'
// Footer nav row for a wizard step: optional Back on the left, an optional Skip
// link + a primary advance button on the right. Captures the Back/Skip/Continue
// (and Finish) pattern shared across the onboarding steps.
const {
  canBack = false,
  skipLabel,
  nextLabel = 'Continue',
  nextIcon = 'next',
  nextPurpose = 'cta',
  showNext = true,
  nextDisabled = false,
  nextLoading = false,
} = defineProps<{
  canBack?: boolean
  /** When set, renders a Skip link emitting `skip`. */
  skipLabel?: string
  nextLabel?: string
  nextIcon?: string
  nextPurpose?: 'cta' | 'secondary'
  /** Hide the primary advance button — e.g. a required step whose own CTA
   *  drives the advance (the plan/trial step). */
  showNext?: boolean
  nextDisabled?: boolean
  nextLoading?: boolean
}>()

const emit = defineEmits<{ back: [], skip: [], next: [] }>()
</script>

<template>
  <div class="flex items-center justify-between pt-2 border-t border-default">
    <UiButton v-if="canBack" purpose="link" size="md" class="min-h-11" @click="emit('back')">
      Back
    </UiButton>
    <span v-else />
    <div class="flex items-center gap-3">
      <UiButton v-if="skipLabel" purpose="link" size="md" class="min-h-11" @click="emit('skip')">
        {{ skipLabel }}
      </UiButton>
      <UiButton
        v-if="showNext"
        :purpose="nextPurpose"
        size="lg"
        class="min-h-11"
        :trailing-icon="nextIcon"
        :label="nextLabel"
        :disabled="nextDisabled"
        :loading="nextLoading"
        @click="emit('next')"
      />
    </div>
  </div>
</template>

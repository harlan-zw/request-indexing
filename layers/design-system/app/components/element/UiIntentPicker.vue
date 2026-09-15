<script setup lang="ts">
import { UiIcon, UInput } from '#components'
// The onboarding intent multi-select ("How can Nuxt SEO Pro help you?") — a
// multi-select card grid plus a free-text "Something else". Single source of
// truth (design-system) for the live teams/create wizard AND the brand-kit
// showcase. Presentation-only: emits the selected ids; the caller maps them to
// internal focus.
import { ONBOARDING_INTENTS } from './onboarding-intents'

const selected = defineModel<string[]>('selected', { default: () => [] })
const other = defineModel<boolean>('other', { default: false })
const otherText = defineModel<string>('otherText', { default: '' })

function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(x => x !== id)
    : [...selected.value, id]
}

const cardClass = 'relative flex min-h-28 cursor-pointer flex-col justify-between rounded-xl border p-4 text-left shadow-sm outline-none transition-[background-color,border-color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-default active:translate-y-px'
const selectedClass = 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/40'
const restClass = 'border-accented bg-default/80 hover:border-primary/60 hover:bg-elevated hover:shadow-md'
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-3 sm:grid-cols-2">
      <button
        v-for="intent in ONBOARDING_INTENTS"
        :key="intent.id"
        type="button"
        :aria-pressed="selected.includes(intent.id)"
        :class="[cardClass, selected.includes(intent.id) ? selectedClass : restClass]"
        @click="toggle(intent.id)"
      >
        <UiIcon
          v-if="selected.includes(intent.id)"
          name="check"
          class="absolute top-3 right-3 size-4 text-primary"
          aria-hidden="true"
        />
        <UiIcon :name="intent.icon" class="size-5 text-highlighted" aria-hidden="true" />
        <div class="mt-4 text-base font-medium text-highlighted">
          {{ intent.label }}
        </div>
      </button>

      <!-- Other (free text) -->
      <button
        type="button"
        :aria-pressed="other"
        :class="[cardClass, other ? selectedClass : restClass]"
        @click="other = !other"
      >
        <UiIcon
          v-if="other"
          name="check"
          class="absolute top-3 right-3 size-4 text-primary"
          aria-hidden="true"
        />
        <UiIcon name="i-lucide-pencil" class="size-5 text-highlighted" aria-hidden="true" />
        <div class="mt-4 text-base font-medium text-highlighted">
          Something else
        </div>
      </button>
    </div>

    <UInput
      v-if="other"
      v-model="otherText"
      size="lg"
      placeholder="Tell us what you're after…"
      aria-label="What else can we help with?"
      class="w-full"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'kit' })
useHead({ title: 'Radius & Surfaces · Brand Kit' })

const radius = [
  { token: 'rounded-sm', size: '6px', use: 'Pills, badges' },
  { token: 'rounded-md', size: '10px', use: 'Buttons, chips' },
  { token: 'rounded-lg', size: '14px', use: 'Inputs, cards' },
  { token: 'rounded-xl', size: '20px', use: 'Large cards' },
  { token: 'rounded-2xl', size: '24px', use: 'Hero panels' },
  { token: 'rounded-full', size: '999px', use: 'Avatars, dots' },
]
const shadows = [
  { token: 'shadow-xs', class: 'shadow-xs', use: 'Subtle separation' },
  { token: 'shadow-sm', class: 'shadow-sm', use: 'Resting cards' },
  { token: 'shadow-md', class: 'shadow-md', use: 'Active cards' },
  { token: 'shadow-lg', class: 'shadow-lg', use: 'Popovers' },
  { token: 'shadow-xl', class: 'shadow-xl', use: 'Modals' },
]
const rings = [
  { class: 'ring-1 ring-default', label: 'ring-default' },
  { class: 'ring-1 ring-accented', label: 'ring-accented' },
  { class: 'ring-1 ring-primary-500/40', label: 'ring-primary/40' },
]
const cards = [
  { variant: 'outline' as const, label: 'outline' },
  { variant: 'subtle' as const, label: 'subtle' },
  { variant: 'soft' as const, label: 'soft' },
]
</script>

<template>
  <div class="space-y-8">
    <KitHeader
      eyebrow="Foundation"
      title="Radius & surfaces"
      description="Radius scales with elevation. Cards, popovers, and inputs sit at the lg tier."
    />

    <KitSection title="Radius scale">
      <UCard variant="outline">
        <div class="flex flex-wrap gap-8">
          <div v-for="r in radius" :key="r.token" class="flex flex-col items-center gap-2 min-w-[80px]">
            <div class="size-20 bg-primary-500/15 ring-1 ring-primary-500/40" :class="[r.token]" />
            <code class="text-[10px] font-mono text-default">{{ r.token }}</code>
            <span class="text-[10px] text-dimmed">{{ r.size }}</span>
            <span class="text-[11px] text-muted text-center">{{ r.use }}</span>
          </div>
        </div>
      </UCard>
    </KitSection>

    <KitSection title="Shadows" code="shadow-*">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div
          v-for="s in shadows"
          :key="s.token"
          class="bg-default rounded-lg p-4 min-h-[100px] flex flex-col justify-between" :class="[s.class]"
        >
          <code class="text-[11px] font-mono text-default">{{ s.token }}</code>
          <span class="text-[11px] text-muted">{{ s.use }}</span>
        </div>
      </div>
    </KitSection>

    <KitSection title="Rings">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="r in rings"
          :key="r.label"
          class="rounded-lg p-5 bg-default" :class="[r.class]"
        >
          <code class="text-[11px] font-mono text-default">{{ r.label }}</code>
        </div>
      </div>
    </KitSection>

    <KitSection title="Card variants" code="<UCard variant>">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <UCard v-for="c in cards" :key="c.label" :variant="c.variant">
          <div class="space-y-1">
            <code class="text-[10px] font-mono text-dimmed">variant="{{ c.label }}"</code>
            <div class="text-sm text-default">
              The card carries content with a quiet ring + subtle background.
            </div>
          </div>
        </UCard>
      </div>
    </KitSection>
  </div>
</template>

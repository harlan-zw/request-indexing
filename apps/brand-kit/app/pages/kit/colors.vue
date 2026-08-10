<script setup lang="ts">
definePageMeta({ layout: 'kit' })
useHead({ title: 'Colors · Brand Kit' })

const palette = [
  { token: 'primary', label: 'Primary', sample: 'bg-primary-500', mono: 'oklch / emerald' },
  { token: 'neutral', label: 'Neutral', sample: 'bg-neutral-500', mono: 'olive (overridden)' },
  { token: 'success', label: 'Success', sample: 'bg-success' },
  { token: 'warning', label: 'Warning', sample: 'bg-warning' },
  { token: 'error', label: 'Error', sample: 'bg-error' },
  { token: 'info', label: 'Info', sample: 'bg-info' },
]
const scaleSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]

const surfaces = [
  { token: '--ui-bg', class: 'bg-default', label: 'bg-default', hint: 'Page' },
  { token: '--ui-bg-muted', class: 'bg-muted', label: 'bg-muted', hint: 'Panels' },
  { token: '--ui-bg-elevated', class: 'bg-elevated', label: 'bg-elevated', hint: 'Cards' },
  { token: '--ui-bg-accented', class: 'bg-accented', label: 'bg-accented', hint: 'Hover' },
  { token: '--ui-bg-inverted', class: 'bg-inverted text-inverted', label: 'bg-inverted', hint: 'CTA' },
]
const texts = [
  { c: 'text-highlighted', desc: 'Titles, key data' },
  { c: 'text-default', desc: 'Body copy' },
  { c: 'text-toned', desc: 'Labels' },
  { c: 'text-muted', desc: 'Descriptions' },
  { c: 'text-dimmed', desc: 'Captions, placeholders' },
]
</script>

<template>
  <div class="space-y-8">
    <KitHeader
      eyebrow="Foundation"
      title="Colors"
      description="Semantic tokens — never raw hex. Surfaces auto-flip between light and dark."
    />

    <KitSection title="Roles" code="bg-{role} / text-{role}">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
        <UCard v-for="p in palette" :key="p.token" variant="outline">
          <div class="flex items-center gap-3">
            <div class="size-12 rounded-md ring-1 ring-default/40" :class="[p.sample]" />
            <div class="min-w-0">
              <div class="text-sm font-medium text-highlighted">
                {{ p.label }}
              </div>
              <code class="text-[11px] font-mono text-dimmed">{{ p.token }}</code>
              <div v-if="p.mono" class="text-[10px] text-dimmed mt-0.5">
                {{ p.mono }}
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </KitSection>

    <KitSection title="Emerald scale" code="--color-emerald-*">
      <div class="grid grid-cols-11 gap-1">
        <div v-for="s in scaleSteps" :key="`em-${s}`" class="flex flex-col items-center gap-1">
          <div
            class="w-full h-14 rounded-md ring-1 ring-default/40"
            :style="{ backgroundColor: `var(--color-emerald-${s})` }"
          />
          <code class="text-[10px] font-mono text-dimmed">{{ s }}</code>
        </div>
      </div>
    </KitSection>

    <KitSection
      title="Olive scale"
      code="--color-olive-*"
      description="Overridden locally to a warmer chroma than Tailwind's near-gray default."
    >
      <div class="grid grid-cols-11 gap-1">
        <div v-for="s in scaleSteps" :key="`ol-${s}`" class="flex flex-col items-center gap-1">
          <div
            class="w-full h-14 rounded-md ring-1 ring-default/40"
            :style="{ backgroundColor: `var(--color-olive-${s})` }"
          />
          <code class="text-[10px] font-mono text-dimmed">{{ s }}</code>
        </div>
      </div>
    </KitSection>

    <KitSection title="Surfaces" description="Auto-flip semantic backgrounds for light/dark.">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div
          v-for="s in surfaces"
          :key="s.token"
          class="rounded-lg p-4 ring-1 ring-default/40 min-h-[120px] flex flex-col justify-between" :class="[s.class]"
        >
          <code class="text-[11px] font-mono opacity-70">{{ s.label }}</code>
          <div class="text-xs">
            {{ s.hint }}
          </div>
        </div>
      </div>
    </KitSection>

    <KitSection title="Text tokens" code="text-{tone}">
      <UCard variant="outline">
        <div class="space-y-2.5">
          <div v-for="t in texts" :key="t.c" class="flex items-baseline gap-6">
            <code class="text-[11px] font-mono text-dimmed w-40 shrink-0">{{ t.c }}</code>
            <span class="text-base" :class="[t.c]">The verdant console nurtures growth — {{ t.desc }}.</span>
          </div>
        </div>
      </UCard>
    </KitSection>
  </div>
</template>

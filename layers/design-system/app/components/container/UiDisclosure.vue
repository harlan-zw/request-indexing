<script setup lang="ts">
import { UiChip, UiIcon } from '#components'
// The sanctioned overflow destination for tertiary content (DESIGN.md
// Composition rules): a quiet native <details> row that keeps detail off the
// page until asked for. Native element = free keyboard/AT semantics and
// find-in-page auto-expand in Chromium — no reka, no motion-v.
//
// Expand/collapse animates via `.ui-disclosure::details-content` +
// interpolate-size in global.css (Chromium); Firefox/Safari toggle instantly.
// Reduced-motion disables the transition in the global block.
//
// Deliberately icon-light: the chevron is the only glyph. No leading icon
// container, no eyebrow — the label is a noun + count, not a CTA.

const { label, count } = defineProps<{
  /** Quiet row label — a noun beats a verb ("Sitemaps", not "Show sitemaps"). */
  label: string
  /** Optional count so the collapsed row still reports scale. */
  count?: number | string
}>()

const open = defineModel<boolean>('open', { default: false })

function onToggle(e: Event) {
  open.value = (e as ToggleEvent).newState === 'open'
}
</script>

<template>
  <details class="ui-disclosure group" :open="open" @toggle="onToggle">
    <summary class="flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden min-h-11 sm:min-h-0 py-1 -mx-1 px-1 rounded-md focus-visible:ring-2 focus-visible:ring-primary outline-none">
      <UiIcon name="chevron-right" class="size-3.5 text-dimmed transition-transform duration-150 group-open:rotate-90" aria-hidden="true" />
      <span class="text-sm font-strong text-muted group-hover:text-default transition-colors">{{ label }}</span>
      <UiChip v-if="count !== undefined" purpose="count">
        {{ count }}
      </UiChip>
      <slot name="actions" />
    </summary>
    <div class="pt-3">
      <slot />
    </div>
  </details>
</template>

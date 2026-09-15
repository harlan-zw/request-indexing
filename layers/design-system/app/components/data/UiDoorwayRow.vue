<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { RichSegment } from '../../../shared/rich-text'
import { computed } from 'vue'
import { NuxtLink, UiFavicon, UiIcon, UiRichText } from '#components'

/**
 * UiDoorwayRow — one line inside a `UiDoorwayColumn`: source identity, the
 * typed headline, an optional trailing fact, a chevron. Nothing else. The row
 * states what is next; the surface it opens owns the evidence.
 *
 * A row that opens a modal is a `<button aria-haspopup="dialog">`, never a
 * `NuxtLink` carrying an `@click`. Vue's `mergeProps` appends a parent's
 * fallthrough click AFTER `RouterLink`'s own `navigate` handler, so the router
 * pushes first and the modal opens onto a page that is already leaving. The
 * click listener here is bound ONLY on the button branch, so a link row can
 * never grow that bug by accident.
 */
const {
  label,
  segments = null,
  glyph = null,
  faviconDomain = null,
  to = null,
  interactive = true,
} = defineProps<{
  /** Plain-text row title. Always required — it is the accessible name. */
  label: string
  /** Typed headline; falls back to `label` when the producer has no segments. */
  segments?: RichSegment[] | null
  glyph?: string | null
  /**
   * Lead with this host's favicon instead of the glyph. Use it where the rows
   * name external entities (a citing site, a platform) — a column of identical
   * kind glyphs carries no signal, the favicons do.
   */
  faviconDomain?: string | null
  /** Navigation destination. Omit for a modal trigger. */
  to?: RouteLocationRaw | null
  /**
   * A read-only log line (no destination, no modal) renders as a plain row: no
   * hover cue, no chevron, no focus ring. Advertising a click a row cannot
   * honour is the defect this flag exists to prevent.
   */
  interactive?: boolean
}>()

const emit = defineEmits<{ select: [] }>()

const kind = computed<'link' | 'button' | 'static'>(() => {
  if (!interactive)
    return 'static'
  return to ? 'link' : 'button'
})
</script>

<template>
  <li>
    <component
      :is="kind === 'link' ? NuxtLink : kind === 'button' ? 'button' : 'div'"
      :to="kind === 'link' ? to! : undefined"
      :type="kind === 'button' ? 'button' : undefined"
      :aria-haspopup="kind === 'button' ? 'dialog' : undefined"
      :aria-label="kind === 'static' ? undefined : label"
      class="flex min-h-11 w-full min-w-0 items-center gap-2.5 px-4 py-1.5 text-left"
      :class="kind === 'static'
        ? ''
        : 'cursor-pointer outline-none transition-colors hover:bg-elevated/40 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:min-h-0'"
      v-on="kind === 'button' ? { click: () => emit('select') } : {}"
    >
      <slot name="leading">
        <UiFavicon v-if="faviconDomain" :domain="faviconDomain" :size="14" decorative class="shrink-0 rounded-sm" />
        <UiIcon v-else-if="glyph" :name="glyph" class="size-3.5 shrink-0 text-dimmed" aria-hidden="true" />
      </slot>
      <span class="min-w-0 flex-1 truncate text-sm leading-5 text-default">
        <UiRichText v-if="segments?.length" :segments="segments" size="sm" truncate />
        <template v-else>{{ label }}</template>
      </span>
      <slot name="trailing" />
      <UiIcon v-if="kind !== 'static'" name="chevron-right" class="size-3 shrink-0 text-dimmed" aria-hidden="true" />
    </component>
  </li>
</template>

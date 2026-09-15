<script setup lang="ts">
import type { SemanticStatus } from '../../composables/semanticColors'
import { NuxtLink, UiIcon } from '#components'
import { semanticColors } from '../../composables/semanticColors'

// One-line diagnosis rollup — the "collapse a card to a sentence" overflow
// move (DESIGN.md Composition rules). A dot carries the status, the sentence
// carries the diagnosis, `to` carries the drill-in. Deliberately one signal
// per line: no icon container, no eyebrow, no second metadata row. If the
// content needs more than a sentence + counts, it has outgrown the strip and
// wants a card or its own page.

const { status = 'neutral', title, to, linkLabel = 'View all' } = defineProps<{
  status?: SemanticStatus
  /** The diagnosis sentence — lead with the noun and the number ("7 broken internal links"). */
  title: string
  /** Drill-in destination. When set the whole row is a NuxtLink with a trailing chevron (canonical clickable-row pattern). */
  to?: string
  linkLabel?: string
}>()
</script>

<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to || undefined"
    class="group flex items-center gap-2.5 rounded-lg border border-default bg-[var(--ui-bg-elevated)]/5 px-3 py-2 min-h-11 sm:min-h-0"
    :class="to && 'hover:bg-[var(--ui-bg-elevated)]/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary outline-none'"
  >
    <span class="size-2 rounded-full shrink-0" :class="semanticColors[status].dot" aria-hidden="true" />
    <slot name="leading" />
    <span class="text-sm text-default truncate">{{ title }}</span>
    <span class="flex-1" />
    <slot name="meta" />
    <template v-if="to">
      <span class="text-xs text-muted group-hover:text-default transition-colors shrink-0">{{ linkLabel }}</span>
      <UiIcon name="chevron-right" class="size-3.5 text-dimmed group-hover:text-default transition-colors shrink-0" aria-hidden="true" />
    </template>
  </component>
</template>

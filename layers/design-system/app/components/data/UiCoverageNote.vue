<script setup lang="ts">
import { computed } from 'vue'
import { NuxtLink, UiIcon } from '#components'
/**
 * UiCoverageNote — the quiet "N of M known · View all" evidence-coverage line
 * that sits under a typed evidence browser. Mirrors pro-actions's
 * `collectionCoverageSchema` (`layers/pro/actions/shared/contracts/action-evidence.ts`)
 * structurally, per the `UiActionTitle`/`ActionTitleSegment` "keep in sync"
 * precedent (ADR-0042: design-system MAY know the shape, never the runtime
 * that builds it — importing the pro-layer's zod schema here would invert the
 * layer graph).
 *
 * Color budget: this is a caption, not a status. It never tints its value —
 * only a single fixed neutral dot (the `UiFactsGrid` status-dot rhythm,
 * without the semantic color) marks it as a coverage caption at a glance.
 */

/** Keep in sync with pro-actions's `CollectionCoverage` (`action-evidence.ts`). */
export type CollectionCoverage
  = | { _tag: 'complete', knownTotal: number }
    | { _tag: 'partial', reportedTotal: number, knownTotal: number, limitation: string }
    | { _tag: 'count-only', reportedTotal: number, limitation: string }
    | { _tag: 'unknown', knownTotal: number, limitation: string }
    | { _tag: 'unavailable', limitation: string }

const { coverage, to } = defineProps<{
  coverage: CollectionCoverage
  /** Deep link for the "View all" tail. Canonical copy — never re-worded per call site. */
  to?: string
}>()

// Split copy into a leading numeral (numerals-display) + trailing words, so
// "7 of 9 known" reads with figures set apart from prose the same way every
// other numeric fact does. `complete`/`unavailable` have no leading count
// worth isolating (either it's redundant with the check glyph, or there's
// nothing counted yet) and render as plain text.
const parts = computed((): { lead?: string, rest: string } => {
  switch (coverage._tag) {
    case 'complete':
      return { rest: `All ${coverage.knownTotal} known` }
    case 'partial':
      return { lead: `${coverage.knownTotal} of ${coverage.reportedTotal}`, rest: 'known' }
    case 'count-only':
      return { lead: `${coverage.reportedTotal}`, rest: 'total, not yet itemized' }
    case 'unknown':
      return { lead: `${coverage.knownTotal}`, rest: 'known, total not yet counted' }
    case 'unavailable':
      return { rest: 'Evidence still compiling' }
    default:
      return { rest: '' }
  }
})

// `partial` is the one state where evidence is actively still growing — the
// dot earns a single settle-once pulse to say "still counting" without
// nagging on every re-render. Every other tag is a steady-state read.
const isGrowing = computed(() => coverage._tag === 'partial')
const isComplete = computed(() => coverage._tag === 'complete')
</script>

<template>
  <p class="flex items-center gap-1.5 text-xs text-muted" data-ui="UiCoverageNote">
    <UiIcon
      v-if="isComplete"
      name="check"
      class="size-3 shrink-0 text-dimmed"
      aria-hidden="true"
    />
    <span
      v-else
      class="size-1 shrink-0 rounded-full bg-[var(--ui-border)]"
      :class="isGrowing && 'coverage-dot-pulse-once'"
      aria-hidden="true"
    />
    <span>
      <span v-if="parts.lead" class="numerals-display text-default">{{ parts.lead }}</span>
      <template v-if="parts.lead">{{ ' ' }}</template>{{ parts.rest }}
    </span>
    <template v-if="to">
      <span class="text-dimmed" aria-hidden="true"> · </span>
      <component
        :is="NuxtLink"
        :to="to"
        class="text-muted underline-offset-2 hover:text-default hover:underline"
      >
        View all
      </component>
    </template>
  </p>
</template>

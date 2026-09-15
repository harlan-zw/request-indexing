<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { RichSegment } from '../../../shared/rich-text'

/**
 * UiRelatedFixes — the related-work strip (ADR-0059 #4): a feature page's slice of
 * open Issues & Opportunities work, rendered beside the data that grounds it.
 *
 * Purely presentational (ADR-0029): rows arrive via props (feature layers
 * query pro-actions's catalog themselves — ADR-0042 lets them consume contracts
 * and queries, never runtime components, so the shared piece lives here).
 * Rows render the shared `UiIssueRow` (compact) so the strip and the board read
 * as one row primitive at two densities.
 *
 * Render contract (deliberate, from the first adopter):
 * - nothing until `loaded` — a skeleton would over-promise a section that is
 *   often (healthily) empty;
 * - when loaded + empty: the quiet `emptyLabel` line if given, else nothing.
 *
 * Click contract (Q1, 2026-06): a row opens the act-surface detail in place via
 * `@select` — the owning layer holds the full action and opens the modal, so the
 * user acts (Start / Work on it / claim) without a page hop. Only the header /
 * footer "View all" navigates to the full Issues & Opportunities board.
 */

import { NuxtLink, UiButton, UiIcon, UiIssueRow } from '#components'

export interface RelatedFixRow {
  id: string
  title: string
  /** Typed headline tokens (`actionDisplay().headline`); falls back to `title` when omitted. */
  richSegments?: RichSegment[]
  evidence?: string | null
  /** The board's deterministic severity — drives the trailing dot. */
  severity: 'error' | 'warning' | 'info'
}

const {
  rows,
  to,
  loaded = false,
  title = 'Related Work',
  emptyLabel,
  moreCount = 0,
  showHeader = true,
} = defineProps<{
  rows: RelatedFixRow[]
  /** The Issues & Opportunities page (optionally ?cluster=-filtered). */
  to: RouteLocationRaw
  loaded?: boolean
  title?: string
  /** Quiet all-clear line when there is no open work; omit to render nothing. */
  emptyLabel?: string
  /** Matches beyond the rendered rows — folds into a "+N more" footer link. */
  moreCount?: number
  /** False when another primitive already owns the panel header/action. */
  showHeader?: boolean
}>()

const emit = defineEmits<{
  /** Row clicked — the owning layer opens the in-place act-surface modal. */
  select: [row: RelatedFixRow]
}>()
</script>

<template>
  <section v-if="loaded && (rows.length || emptyLabel)">
    <div v-if="showHeader" class="mb-2 flex items-baseline justify-between">
      <h3 class="text-sm font-semibold text-highlighted">
        {{ title }}
      </h3>
      <UiButton
        v-if="rows.length"
        label="View all"
        size="xs"
        purpose="quiet"
        trailing-icon="next"
        :to="to"
      />
    </div>
    <ul v-if="rows.length" class="divide-y divide-default overflow-hidden rounded-lg border border-default">
      <li v-for="row in rows" :key="row.id">
        <button
          type="button"
          class="block w-full cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="emit('select', row)"
        >
          <UiIssueRow
            density="compact"
            :title="row.title"
            :rich-segments="row.richSegments"
            :evidence="row.evidence"
            :severity="row.severity"
            interactive
          />
        </button>
      </li>
      <li v-if="moreCount > 0">
        <NuxtLink
          :to="to"
          class="flex min-h-11 items-center gap-2 py-2 pl-4 pr-3.5 text-sm text-muted transition-colors hover:bg-elevated/60"
        >
          +{{ moreCount }} more
          <UiIcon name="chevron-right" class="size-3 shrink-0 text-dimmed" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
    <p v-else class="flex items-center gap-1.5 text-xs text-muted">
      <UiIcon name="check" class="size-3.5 shrink-0 text-dimmed" aria-hidden="true" />
      {{ emptyLabel }}
    </p>
  </section>
</template>

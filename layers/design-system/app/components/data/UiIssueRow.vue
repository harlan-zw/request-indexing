<script setup lang="ts">
import type { RichSegment } from '../../../shared/rich-text'
import type { FaviconStackSite } from '../element/UiFaviconStack.vue'
import { computed } from 'vue'
import { UiFaviconStack, UiIcon, UiImpactMeter, UiNavIcon, UiRichText, UiSeverityMarker } from '#components'
/**
 * The shared issue and opportunity row. Diagnosis leads. Source identity is
 * available in regular layouts. Compact rows rely on their page context. A
 * regular row may add a Site favicon for portfolio decisions.
 *
 * The row reads on ONE line from `sm` up. State ("New", "In progress") is an
 * inline mark after the diagnosis, the Site and the value are right-aligned,
 * and only a caller-supplied `evidence` string opens a second line. The parent
 * owns interaction. `interactive` adds the matching hover and chevron without
 * creating nested controls.
 */

const {
  title,
  richSegments,
  evidence,
  severity,
  showSeverity = true,
  syncing = false,
  subdued = false,
  impact,
  impactLabel,
  density = 'compact',
  glyphIcon,
  glyphHint,
  value,
  novelty,
  status,
  site,
  interactive = false,
} = defineProps<{
  title: string
  /**
   * Typed headline tokens (`actionDisplay().headline`), rendered via `UiRichText`.
   * Falls back to the plain `title` string when omitted.
   */
  richSegments?: RichSegment[]
  /** One dim secondary line; suppressed when it merely repeats the title. */
  evidence?: string | null
  /** The board's deterministic severity, shown with a distinct marker shape. */
  severity: 'error' | 'warning' | 'info'
  /**
   * Render the severity bar. Off for opportunity lists, where severity is
   * uniformly `info` — an identical bar on every row carries no signal (the
   * `value` column is the differentiator there). On for Issues, where it varies.
   */
  showSeverity?: boolean
  /**
   * The engine is checking this row (a claimed change awaiting verification).
   * Renders a pulsing dot in the marker slot: the row is not a live fault to
   * triage, so it must not read like one. The caller turns severity off.
   */
  syncing?: boolean
  /**
   * Opportunity impact tier — renders a `UiImpactMeter` in the severity slot.
   * Pass only on PURE opportunity lists (every row carries one), never in a
   * mixed list where issues rows lead with the thinner severity bar — the two
   * glyph widths would stagger the title column.
   */
  impact?: 1 | 2 | 3 | null
  /** Tooltip + sr-only label for the impact meter. */
  impactLabel?: string
  density?: 'compact' | 'regular'
  /**
   * Lower the diagnosis weight for rows listed under a pattern header. The
   * readable 14px size stays unchanged.
   */
  subdued?: boolean
  /** `regular` fallback when the `leading` slot is empty. */
  glyphIcon?: string
  glyphHint?: string
  /** The row's primary stat — the bold top of the right cell (e.g. "~17K/mo"). */
  value?: string | null
  /**
   * "New" / "Returned" — a quiet inline mark after the diagnosis. It used to
   * open a second line, which cost the row its whole height to carry one word.
   */
  novelty?: string | null
  /** Progress label, when the row itself owns that context. */
  status?: string | null
  /**
   * Cross-site identity, shown as one framed favicon in the right column,
   * before the value and the chevron. Spelled out, the Site name was a second
   * text column that fought the diagnosis for the same truncating line; the
   * favicon says the same thing in 20px and keeps the name one hover away.
   */
  site?: FaviconStackSite | null
  /** True when the parent is a link or button. Controls hover and the chevron. */
  interactive?: boolean
}>()

// The dim secondary line drops a duplicate of the title.
const evidenceText = computed(() => (evidence && evidence.trim() !== title.trim() ? evidence.trim() : null))
// Only state that changes the next choice belongs in the summary row, and it
// reads on the HORIZONTAL plane: one word ("New", "In progress") is not worth
// a second line, and stacked down a list it painted a stripe rather than a
// signal. Callers already suppress a mark every row would carry.
const stateMark = computed(() => status || novelty)
</script>

<template>
  <div
    class="flex min-h-11 items-start gap-2.5 py-2.5 pl-4 pr-3.5 transition-colors sm:min-h-0 sm:items-center"
    :class="interactive ? 'hover:bg-elevated/60' : ''"
  >
    <div class="flex min-w-0 flex-1 flex-col gap-1">
      <!-- Severity, Source, then the diagnosis. -->
      <p class="flex min-w-0 items-start gap-1.5 text-sm leading-5 text-highlighted sm:items-center" :class="subdued ? 'font-normal' : 'font-medium'">
        <UiSyncDot v-if="syncing" status="syncing" size="2" class="shrink-0" />
        <UiSeverityMarker v-else-if="showSeverity" :severity />
        <UiImpactMeter v-else-if="impact" :tier="impact" :label="impactLabel" class="shrink-0" />
        <span v-if="density !== 'compact' && ($slots.leading || glyphIcon)" :title="$slots.leading ? undefined : glyphHint" class="mt-0.5 shrink-0 sm:mt-0">
          <slot name="leading">
            <UiNavIcon :icon="glyphIcon!" size="xs" />
          </slot>
        </span>
        <!-- No `flex-1`: the mark below must hug the diagnosis it qualifies.
             Grown to fill, the title pushed the mark to the far right of this
             column, where it read as a prefix of the value. -->
        <span class="min-w-0 line-clamp-2 sm:line-clamp-1">
          <UiRichText v-if="richSegments?.length" :segments="richSegments" size="sm" inert-links truncate />
          <template v-else>
            {{ title }}
          </template>
        </span>
        <!-- Neutral text, never a tinted badge: these repeat down a list. -->
        <span v-if="stateMark" class="shrink-0 text-mini font-medium uppercase tracking-wide text-dimmed">{{ stateMark }}</span>
      </p>
      <!-- Evidence stays a line of its own; the value falls under the title
           only where the right column is hidden. -->
      <p v-if="evidenceText || value" class="min-w-0 text-sm text-muted">
        <span v-if="evidenceText" class="block truncate">{{ evidenceText }}</span>
        <span v-if="value" class="mt-0.5 block truncate font-medium tabular-nums text-default sm:hidden">{{ value }}</span>
      </p>
    </div>

    <!-- Site, Impact and the interaction cue earn a right column. -->
    <div v-if="site || value || interactive" class="flex shrink-0 items-center gap-2.5 pt-0.5 sm:pt-0">
      <UiFaviconStack v-if="site" :sites="[site]" size="xs" />
      <span v-if="value" class="hidden whitespace-nowrap text-sm font-medium tabular-nums text-default sm:inline">{{ value }}</span>
      <UiIcon v-if="interactive" name="chevron-right" class="size-3.5 shrink-0 text-muted" aria-hidden="true" />
    </div>
  </div>
</template>

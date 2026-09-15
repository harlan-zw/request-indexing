<script setup lang="ts">
import type { RichSegment } from '../../../shared/rich-text'
import { NuxtLink, UiFavicon, UiIcon, UiTooltip } from '#components'
/**
 * UiRichText — renders a `RichSegment[]` inline sentence of typed tokens.
 * Supersedes the retired `UiActionTitle` (deleted Phase 4, 2026-07-29, once
 * its last consumers moved to `richSegments`) — same styling precedent,
 * extended with `page`/`domain`/`delta`/`code` and optional tooltips/deep
 * links. See `../../../shared/rich-text.ts`
 * for the pinned contract; segments are never parsed from prose here, they
 * arrive already typed from a why-template.
 *
 * Colour budget (DESIGN.md, near-monochrome): the only pieces that earn hue are
 * `position`'s quality band (mirrors `UiPositionMetric`) and `delta` when its
 * caller passes an explicit `good`. Everything else is weight, mono, and
 * dimming — no chip fills. Every hue-bearing signal also gets a text/aria
 * equivalent so it's never colour-only (WCAG 1.4.1).
 *
 * Brand-flavor pass (2026-07-28, Phase 2 Wave B3) — personality through
 * typography, not decoration: `metric`/`position`/delta's `to` value ride
 * `.numerals-display`(-heavy) so figures read as set, not typed; `keyword`
 * quotes are curly + hair-spaced (U+200A) off the mono run so they read as
 * intentional typography, not stray punctuation; `delta` pairs fade/lift 2px
 * once on mount (`.rich-delta-reveal`, registered in the reduced-motion
 * block); `domain` favicons sit in a 14px ring-tinted frame — the one place a
 * primary tint is allowed, because it marks an external entity, not a status,
 * and their gap is em-relative and narrower than the row's `gap-x-[0.25em]`
 * inter-word space so the host stays grouped with its own favicon;
 * `page` dims its leading directory so the differentiating last segment pops;
 * `code` gets a whisper `bg-elevated` inset, distinct from `.code-inline`'s
 * bolder chip.
 */

const { segments, size = 'sm', truncate = false, spacing = 'auto', inertLinks = false } = defineProps<{
  segments: RichSegment[]
  /**
   * Render every linked token as plain text — no `NuxtLink`, no external `<a>`.
   *
   * Set by any host that is ITSELF inside an interactive element (a linked row,
   * a `<button>` row). An `<a>` inside an `<a>` is not valid HTML: the parser
   * closes the outer anchor before the inner one, so the server's byte stream
   * and the client's vdom describe different trees and hydration mismatches on
   * every such row. `<a>` inside `<button>` is invalid for the same reason
   * (interactive content has no interactive descendants), and swallows the
   * button's own activation.
   *
   * The affordance isn't lost, it moves: the row opens a detail surface that
   * renders the SAME segments with their links live.
   *
   * An `external` `domain` segment is the one token that links without a `to`
   * (a raw `<a href>`), so it is gated on this flag directly and falls through
   * to the span form, which keeps the ring-framed favicon marking it external.
   */
  inertLinks?: boolean
  /**
   * Who owns the whitespace between segments.
   *
   * `auto` (default) — this component injects a space before each segment. Right
   * for a TOKEN LIST, where segments are discrete things sitting side by side.
   *
   * `none` — the caller's text segments already carry their own spaces. Right for
   * a SENTENCE, where a token can be followed by punctuation: with `auto`, a
   * possessive renders `example.com 's traffic?` and a trailing token renders
   * `3 months ?`. Pair it with `whitespace-pre-wrap` on the host so the caller's
   * literal spaces survive.
   */
  spacing?: 'auto' | 'none'
  /** Text-size + density knob. `sm` matches `UiActionTitle`'s ambient board-row
   *  usage (inherits `text-sm` from the caller); `md`/`lg` size the sentence
   *  directly for standalone headline contexts (e.g. the modal why-sentence);
   *  `inherit` stamps no size at all — for hosts whose row scale isn't `sm`
   *  (e.g. a `text-xs` feed row) where the tokens size off the ambient `em`. */
  size?: 'sm' | 'md' | 'lg' | 'inherit'
  /**
   * Single-line row mode with PER-SEGMENT truncation. A one-line host that
   * end-truncates the whole sentence lets a long leading token push the rest
   * out entirely (a fault-first "404 Not Found — <path>" row on a narrow card
   * showed no path at all) — here the sentence becomes an inline-flex row
   * where only the long-tail segments (`page`/`keyword`/`code`) shrink with
   * their own ellipsis, so every token stays represented. Those segments
   * render tooltip-less in this mode (a tooltip wrapper span can't shrink);
   * `page` keeps its full URL in `title`. Off for wrapping contexts (modal
   * sentences) where multi-line flow is the point.
   */
  truncate?: boolean
}>()

const sizeClass = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  inherit: '',
} as const

// Position quality → semantic text colour + a screen-reader qualifier, so the
// signal never rides on hue alone. Mirrors UiPositionMetric's bands.
// Deliberate second, severity-toned tier variant for inline prose — NOT
// `UiPositionMetric`'s table-cell spec (amber 1-3 / blue 4-10 / muted 11+).
// A sentence needs a binary-ish "is this fine or not" read at a glance, so
// `position` here uses the same success/warning/error vocabulary every other
// inline segment (delta, coverage) already carries; the table component's
// tighter banding stays as-is for its own denser, side-by-side context.
// Confirmed 2026-07-28 visual-scoring pass — not drift, see gap-hunt.md.
function positionMeta(position: number): { tone: string, label: string } {
  if (!Number.isFinite(position))
    return { tone: 'text-muted', label: '' }
  if (position < 10)
    return { tone: 'text-success', label: ' (strong rank)' }
  if (position < 30)
    return { tone: 'text-warning', label: ' (moderate rank)' }
  return { tone: 'text-error', label: ' (weak rank)' }
}

// Delta colour rides ONLY on an explicit `good` — direction alone (up/down/flat)
// never implies "better"/"worse" on its own (e.g. a ranking POSITION going up
// is worse). Neutral is the default so the trend color budget stays hero-only.
function deltaTone(good?: boolean): string {
  if (good === true)
    return 'text-success'
  if (good === false)
    return 'text-error'
  return 'text-muted'
}

const DELTA_ICON = {
  up: 'arrow-up-right',
  down: 'arrow-down-right',
  flat: 'next',
} as const

function deltaAriaLabel(seg: Extract<RichSegment, { kind: 'delta' }>): string {
  const verdict = seg.good === true ? ', improved' : seg.good === false ? ', worsened' : ''
  return `${seg.from} to ${seg.to}, trending ${seg.direction}${verdict}`
}

// Tooltip only wraps when the tooltip text says something the visible label
// doesn't already say — an identical tooltip is dead weight on the trigger.
function visibleText(seg: RichSegment): string {
  switch (seg.kind) {
    case 'delta': return `${seg.from} ${seg.to}`
    default: return 'text' in seg ? seg.text : ''
  }
}
function showTooltip(seg: RichSegment): boolean {
  return 'tooltip' in seg && !!seg.tooltip && seg.tooltip !== visibleText(seg)
}

/**
 * The route a segment links to, or `undefined` under `inertLinks`. Every
 * link-bearing branch below reads its `to` through here, so there is one place
 * that decides whether this sentence emits anchors at all.
 */
function segTo(seg: RichSegment): string | undefined {
  if (inertLinks)
    return undefined
  return 'to' in seg && seg.to ? seg.to : undefined
}

/** Punctuation that binds to the word before it — a space in front reads as a typo. */
const BINDS_LEFT = /^["'’`.,!?;:)\]}%…]/

/**
 * Whether to emit a space before segment `i`.
 *
 * The spacing is injected rather than carried in the caller's text because a
 * literal space at the boundary of an adjacent `inline-flex` token does not
 * survive HTML whitespace handling — measured, not assumed.
 *
 * `spacing="none"` (sentence mode) keeps the injection but skips it where the
 * next run opens with punctuation that binds leftward, so a possessive renders
 * `example.com's traffic?` rather than `example.com 's traffic?`. Token-list
 * callers (the default) space unconditionally, since a token list has no
 * punctuation running between its items.
 */
function needsLeadingSpace(seg: RichSegment, i: number): boolean {
  if (i === 0 || seg.kind === 'sep' || truncate)
    return false
  if (spacing !== 'none')
    return true
  return !(seg.kind === 'text' && BINDS_LEFT.test(seg.text))
}

// `page` compaction: the leading directory reads as context (dimmed), the
// last path segment is the differentiating part and carries full weight —
// mirrors why the path was compacted to begin with (compactTarget's
// rationale: don't make the reader re-parse a whole URL to find what changed).
function splitPathTail(text: string): { lead: string, tail: string } {
  const idx = text.lastIndexOf('/')
  if (idx < 0 || idx === text.length - 1)
    return { lead: '', tail: text }
  return { lead: text.slice(0, idx + 1), tail: text.slice(idx + 1) }
}
</script>

<template>
  <span
    :class="[sizeClass[size], truncate ? 'inline-flex min-w-0 max-w-full items-baseline gap-x-[0.25em] overflow-hidden whitespace-nowrap' : '']"
    data-ui="UiRichText"
  >
    <template v-for="(seg, i) in segments" :key="i">
      <!-- Flex mode spaces via gap; whitespace-only text nodes are dropped by flex layout. -->
      <template v-if="needsLeadingSpace(seg, i)">{{ ' ' }}</template>

      <span v-if="seg.kind === 'text'">{{ seg.text }}</span>

      <span v-else-if="seg.kind === 'sep'" class="text-dimmed" aria-hidden="true"> · </span>

      <!-- Truncate-mode long-tail tokens: tooltip-less so the flex item IS the
           shrinkable element (a tooltip trigger wrapper can't shrink). -->
      <component
        :is="segTo(seg) ? NuxtLink : 'code'"
        v-else-if="seg.kind === 'keyword' && truncate"
        :to="segTo(seg)"
        class="min-w-0 shrink truncate font-mono tracking-[-0.01em] text-default"
        :class="segTo(seg) ? 'underline decoration-dotted decoration-muted underline-offset-4 hover:text-highlighted hover:decoration-solid' : ''"
        :title="seg.tooltip || undefined"
      ><span class="text-dimmed" aria-hidden="true">&ldquo;&#8202;</span>{{ seg.text }}<span class="text-dimmed" aria-hidden="true">&#8202;&rdquo;</span></component>

      <UiTooltip v-else-if="seg.kind === 'keyword'" :disabled="!showTooltip(seg)" :text="seg.tooltip">
        <component
          :is="segTo(seg) ? NuxtLink : 'code'"
          :to="segTo(seg)"
          class="font-mono tracking-[-0.01em] text-default"
          :class="segTo(seg) || showTooltip(seg) ? 'underline decoration-dotted decoration-muted underline-offset-4 hover:text-highlighted hover:decoration-solid' : ''"
        ><span class="text-dimmed" aria-hidden="true">&ldquo;&#8202;</span>{{ seg.text }}<span class="text-dimmed" aria-hidden="true">&#8202;&rdquo;</span></component>
      </UiTooltip>

      <component
        :is="segTo(seg) ? NuxtLink : 'span'"
        v-else-if="seg.kind === 'handle'"
        :to="segTo(seg)"
        class="font-mono text-[0.92em] text-default"
        :class="segTo(seg) ? 'underline-offset-2 hover:text-highlighted hover:underline' : ''"
      >{{ seg.text }}</component>

      <component
        :is="segTo(seg) ? NuxtLink : 'span'"
        v-else-if="seg.kind === 'page' && truncate"
        :to="segTo(seg)"
        class="min-w-0 shrink truncate font-sans"
        :class="segTo(seg) ? 'underline-offset-2 hover:text-highlighted hover:underline' : ''"
        :aria-label="seg.text"
        :title="seg.tooltip || seg.url"
      ><span class="hidden text-dimmed sm:inline">{{ splitPathTail(seg.text).lead }}</span><span class="text-default">{{ splitPathTail(seg.text).tail }}</span></component>

      <UiTooltip v-else-if="seg.kind === 'page'" :disabled="!showTooltip(seg)" :text="seg.tooltip">
        <component
          :is="segTo(seg) ? NuxtLink : 'span'"
          :to="segTo(seg)"
          class="font-sans truncate align-bottom"
          :class="segTo(seg) ? 'underline-offset-2 hover:text-highlighted hover:underline' : ''"
          :title="seg.url"
        ><span class="text-dimmed">{{ splitPathTail(seg.text).lead }}</span><span class="text-default">{{ splitPathTail(seg.text).tail }}</span></component>
      </UiTooltip>

      <a
        v-else-if="seg.kind === 'domain' && seg.external && !inertLinks"
        :href="`https://${seg.domain}`"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-[0.2em] align-middle font-medium text-default underline-offset-2 hover:text-highlighted hover:underline"
      >
        <span class="inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm ring-1 ring-primary/30 bg-primary/8">
          <UiFavicon :domain="seg.domain" :size="11" decorative />
        </span>
        {{ seg.text }}
        <UiIcon name="external" class="size-2.5 text-dimmed" aria-hidden="true" />
        <span class="sr-only">(opens in a new tab)</span>
      </a>
      <component
        :is="segTo(seg) ? NuxtLink : 'span'"
        v-else-if="seg.kind === 'domain'"
        :to="segTo(seg)"
        class="inline-flex items-center gap-[0.2em] align-middle font-medium text-default"
        :class="segTo(seg) ? 'underline-offset-2 hover:text-highlighted hover:underline' : ''"
      >
        <span class="inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm ring-1 ring-primary/30 bg-primary/8">
          <UiFavicon :domain="seg.domain" :size="11" decorative />
        </span>
        {{ seg.text }}
      </component>

      <UiTooltip v-else-if="seg.kind === 'metric'" :disabled="!showTooltip(seg)" :text="seg.tooltip">
        <span class="numerals-display text-default">{{ seg.text }}</span>
      </UiTooltip>

      <span
        v-else-if="seg.kind === 'position'"
        class="numerals-display numerals-display-heavy"
        :class="positionMeta(seg.position).tone"
        :title="`Position ${seg.position}${positionMeta(seg.position).label}`"
      >{{ seg.text }}<span class="sr-only">{{ positionMeta(seg.position).label }}</span></span>

      <UiTooltip v-else-if="seg.kind === 'delta'" :disabled="!showTooltip(seg)" :text="seg.tooltip">
        <span
          class="rich-delta-reveal inline-flex items-center gap-1.5"
          :class="deltaTone(seg.good)"
          :title="deltaAriaLabel(seg)"
        >
          <span class="numerals-display text-muted">{{ seg.from }}</span>
          <UiIcon :name="DELTA_ICON[seg.direction]" class="size-3 shrink-0" aria-hidden="true" />
          <span class="numerals-display numerals-display-heavy">{{ seg.to }}</span>
          <span class="sr-only">{{ deltaAriaLabel(seg) }}</span>
        </span>
      </UiTooltip>

      <code v-else-if="seg.kind === 'code'" class="rounded-[3px] bg-elevated px-1 py-0.5 font-mono text-[0.85em] text-muted ring-1 ring-default/60" :class="truncate ? 'min-w-0 shrink truncate' : ''">{{ seg.text }}</code>
    </template>
  </span>
</template>

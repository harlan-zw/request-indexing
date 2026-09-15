/**
 * `RichSegment` — the typed inline-token vocabulary for action/entity prose.
 *
 * Pinned contract (both the design-system `UiRichText` renderer and pro-actions's
 * `action-display.ts` build against exactly this shape). pro-actions mirrors this
 * type structurally with a "keep in sync" comment (ADR-0042: design-system MAY
 * know the shape, never the runtime that produces it). Supersedes the retired
 * `UiActionTitle` / `ActionTitleSegment` regex-recovered vocabulary (deleted
 * Phase 4, sprint-action-typed-rendering, 2026-07-29).
 *
 * A segment is never parsed from prose at render time — it is produced upstream
 * by a typed why-template, so every token here already carries its own display
 * data (no regex, no string surgery in the renderer).
 */
export type RichSegment
  = | { kind: 'text', text: string }
  /** Renders ' · ' — a calm, aria-hidden divider between segments. */
    | { kind: 'sep' }
  /** Quoted mono run (keyword treatment). */
    | { kind: 'keyword', text: string, to?: string, tooltip?: string }
  /** Social @handle. */
    | { kind: 'handle', text: string, to?: string }
  /** Compacted path; the full URL belongs in the tooltip/title, not the label. */
    | { kind: 'page', text: string, url: string, to?: string, tooltip?: string }
  /** Favicon + host. `external` opens the domain itself in a new tab. */
    | { kind: 'domain', text: string, domain: string, external?: boolean, to?: string }
  /** Numerals-display, tabular figure. */
    | { kind: 'metric', text: string, tooltip?: string }
  /** '#8' with `UiPositionMetric`-style quality bands. */
    | { kind: 'position', text: string, position: number }
  /** '19 → 26' linked pair. Colour rides ONLY on an explicit `good`; otherwise neutral. */
    | { kind: 'delta', from: string, to: string, direction: 'up' | 'down' | 'flat', good?: boolean, tooltip?: string }
  /** Selectors, rule ids — mono, unquoted (distinct from `keyword`). */
    | { kind: 'code', text: string }

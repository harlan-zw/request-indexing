import { useState } from 'nuxt/app'

/**
 * useActivityOverlay — the layer-agnostic trigger for the activity detail
 * overlay (2026-08). Every "Recent Activity" row, on every surface, opens the
 * SAME detail surface through this channel.
 *
 * The defect it exists to kill: an activity row knows exactly which entity it
 * is about (a referring domain, a mention URL, a scanned page), and its
 * destination threw that identity away and dropped the reader on a list. A row
 * about `t128n.dev` landed on the whole backlink profile; a mention row had no
 * destination at all. One overlay, one contract, so the class dies rather than
 * one instance of it.
 *
 * Why it lives in design-system, not in a pro-* layer: ADR-0042 forbids feature
 * layers importing each other's runtime, and the writers span pro-timeline,
 * pro-dataforseo and `apps/pro`. So the trigger is a generic `useState` channel
 * here (which every layer may import) and `apps/pro` owns the host
 * (`ProActivityOverlayHost`) that reads this state and renders the real change
 * brief. Same seam shape as `useIssueOverlay`; the entry travels opaquely
 * (`unknown`) so design-system never learns the ChangeEntry shape.
 *
 * A row must only write here when it holds real evidence. An empty overlay is
 * worse than a row that says nothing.
 */

export interface ActivityOverlayRequest {
  /** The activity entry (opaque here; the host casts it to `ChangeEntry`). */
  entry: unknown
  /** The site the activity belongs to — the brief is site-scoped. */
  siteId: string
  /**
   * The owning site record, when the caller already holds one. Opaque for the
   * same reason `entry` is. Omitted callers fall back to the session lookup.
   */
  site?: unknown
  /** When the owning site was last assessed — the brief's "as of" anchor. */
  assessedAt?: string | null
  /** Bumped per open so the host re-triggers even for the same entry. */
  nonce: number
}

/** The shared overlay channel — read by the host, written by `open`. */
export function useActivityOverlayState() {
  return useState<ActivityOverlayRequest | null>('pro:activity-overlay', () => null)
}

export function useActivityOverlay() {
  const state = useActivityOverlayState()
  return {
    open(req: { entry: unknown, siteId: string, site?: unknown, assessedAt?: string | null }) {
      state.value = { ...req, nonce: (state.value?.nonce ?? 0) + 1 }
    },
  }
}

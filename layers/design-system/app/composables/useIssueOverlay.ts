import { useState } from 'nuxt/app'

/**
 * useIssueOverlay — the layer-agnostic trigger for the in-place issue detail
 * (Q1, 2026-06). Feature-page related-work strips open a single issue's act-surface
 * modal without navigating to the board; only the strip's "View all" navigates.
 *
 * Why it lives in design-system, not pro-actions: ADR-0042 forbids feature
 * layers (pro-perf / pro-gsc / pro-dataforseo) from importing pro-actions
 * runtime. So the trigger is a generic `useState` channel here (which every
 * layer may import), and pro-actions owns the host (`ProIssueOverlayHost`) that
 * reads this state and renders the actual `ProActionRow` modal. The action
 * is carried opaquely (`unknown`) so design-system never learns the BoardAction
 * shape — the host casts it back.
 */

export interface IssueOverlayRequest {
  /** The full board action (opaque here; the pro-actions host casts it). */
  action: unknown
  siteId: string
  /** Cross-site label when opened from the portfolio surface. */
  siteName?: string
  /** Bare host (no scheme) for the Work Prompt / MCP call — omitted falls back to "my site". */
  siteHost?: string
  /** Query keys the modal invalidates on a mutation (the caller's related read). */
  invalidateKeys?: string[]
  /** Bumped per open so the host re-triggers even for the same action. */
  nonce: number
}

/** The shared overlay channel — read by the host, written by `open`. */
export function useIssueOverlayState() {
  return useState<IssueOverlayRequest | null>('pro:issue-overlay', () => null)
}

export function useIssueOverlay() {
  const state = useIssueOverlayState()
  return {
    open(req: { action: unknown, siteId: string, siteName?: string, siteHost?: string, invalidateKeys?: string[] }) {
      state.value = { ...req, nonce: (state.value?.nonce ?? 0) + 1 }
    },
  }
}

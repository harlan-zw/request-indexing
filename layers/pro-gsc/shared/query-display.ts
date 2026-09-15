// Shared display rules for surfacing GSC search queries consistently across the
// dashboard. Pure functions and data constants only: server-safe, no Vue.
//
// Ported from nuxtseo.com `layers/pro/gsc/shared/query-display.ts`.
import { isBroadBrandQuery } from './brand-queries'

/**
 * Average position at or below which a query's rank is worth surfacing as a
 * badge. Above this the position carries little signal, so hiding it reduces
 * noise. Single source of truth for the `ProQueryLabel` position badge gate.
 */
export const POSITION_DISPLAY_THRESHOLD = 7

/**
 * Places a query's average position must worsen by, against the comparison
 * period, before it counts as having fallen.
 *
 * Every other surface that labels something "Declining" classifies on clicks.
 * A query whose rank collapsed while its clicks held is invisible to all of
 * them, which is the hole this badge fills.
 */
export const POSITION_FALL_PLACES = 3

/** Impressions floor for the fall verdict. */
export const POSITION_FALL_MIN_IMPRESSIONS = 100

export interface QueryPositionFall {
  /** Places lost since the comparison period (always >= POSITION_FALL_PLACES). */
  places: number
  /** Average position in the comparison period. */
  from: number
  /** Average position now. */
  to: number
}

/**
 * Whether a query's rank has fallen far enough to flag, and by how much. Pure
 * row arithmetic, so the verdict costs no extra read.
 */
export function positionFall(input: {
  position?: number | null
  previousPosition?: number | null
  impressions?: number | null
}): QueryPositionFall | null {
  const { position, previousPosition, impressions } = input
  // 0 is "not measured in this window", never "ranked zeroth". A query with no
  // impressions on one side of the comparison cannot prove a move, and treating
  // the hole as a number invents a 100-place collapse.
  if (position == null || previousPosition == null || position <= 0 || previousPosition <= 0)
    return null
  if ((impressions ?? 0) < POSITION_FALL_MIN_IMPRESSIONS)
    return null
  const places = position - previousPosition
  if (places < POSITION_FALL_PLACES)
    return null
  return { places, from: previousPosition, to: position }
}

/**
 * Whether a query is one of the site's brand terms. Matches exact brands plus
 * brand modifiers such as "nuxt seo pricing", while avoiding short-token
 * substring false positives.
 */
export function isBrandTerm(query: string | null | undefined, brandTerms: readonly string[]): boolean {
  return isBroadBrandQuery(query, brandTerms)
}

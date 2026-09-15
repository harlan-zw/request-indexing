import { z } from 'zod'

// §8.A — the trust gate. A SIBLING verdict (never a mutation of `SiteTriage` /
// the SDK headline) that answers the question the pages never asked: "is this
// coverage data trustworthy, and is the sitemap even alive?". Computed OUTSIDE
// the 6h triage cache from liveness + freshness, so it never lies for up to 6h
// on recovery (§10). Representativeness (inspected/sitemapTotal) is a CAPTION,
// never a verdict-blocker — so it is NOT part of this contract.
//
// No `engine` field ([[ADR-0084]]): the state enum + reason are all one engine
// needs; an engine discriminant is added only when a second engine is real.

export const trustGateStateSchema = z.enum([
  'ok', // liveness reachable (or unprobed + no corroboration) — the 97% path
  'unknown', // can't actively confirm (no probe) but the cache looks broken
  'blip', // a single probe failure, no corroboration — a warning, not the red gate
  'broken', // probe failure + corroboration — the incident: indexing cannot be confirmed
  'no_sitemap', // host reachable, sitemap 404 / none submitted
  'not_connected', // Search Console not linked
  'pending', // connected but inspection / first sync hasn't produced data yet
])
export type TrustGateState = z.infer<typeof trustGateStateSchema>

export const trustGateSchema = z.object({
  state: trustGateStateSchema,
  /** One developer-voice sentence explaining the state (no marketer copy, no em dashes). */
  reason: z.string(),
})
export type TrustGate = z.infer<typeof trustGateSchema>

/** States where the verdict is degraded — the card switches to its diagnosis variant. */
export const TRUST_DEGRADED_STATES: ReadonlySet<TrustGateState> = new Set(['unknown', 'blip', 'broken', 'no_sitemap'])

export function isTrustDegraded(state: TrustGateState): boolean {
  return TRUST_DEGRADED_STATES.has(state)
}

// Sitemap collapse policy, ported from `@gscdump/analysis` (`sitemap-health.ts`).
// request-indexing installs only `@gscdump/{contracts,engine,sdk}`, so the
// policy lives here instead of behind another dependency. Pure data in, data
// out: the trust gate and the sitemaps report both read it.

export interface SitemapCollapsePolicy {
  ratio: number
  minHighWater: number
  minDrop: number
  baselineOffset: 1 | 2
}

export const SITEMAP_SYNC_COLLAPSE_POLICY: SitemapCollapsePolicy = {
  ratio: 0.5,
  minHighWater: 10,
  minDrop: 10,
  baselineOffset: 1,
}

export const SITEMAP_TRUST_COLLAPSE_POLICY: SitemapCollapsePolicy = {
  ratio: 0.2,
  minHighWater: 20,
  minDrop: 0,
  baselineOffset: 2,
}

export type SitemapCollapseState
  = | { _tag: 'none' }
    | {
      _tag: 'awaiting_confirmation' | 'persisted' | 'recovered_blip'
      current: number
      highWater: number
    }

export interface CurrentSitemapScope {
  current: number
  highWater: number
  collapsed: boolean
}

function isCollapsed(count: number, highWater: number, policy: SitemapCollapsePolicy): boolean {
  return highWater >= policy.minHighWater
    && count < highWater * policy.ratio
    && highWater - count >= policy.minDrop
}

export function classifySitemapCollapse(
  newestFirstCounts: ReadonlyArray<number | null | undefined>,
  policy: SitemapCollapsePolicy,
): SitemapCollapseState {
  if (newestFirstCounts.length <= policy.baselineOffset)
    return { _tag: 'none' }
  const current = Math.max(0, newestFirstCounts[0] ?? 0)
  const previous = Math.max(0, newestFirstCounts[1] ?? 0)
  const highWater = Math.max(
    0,
    ...newestFirstCounts.slice(policy.baselineOffset).map(value => Math.max(0, value ?? 0)),
  )
  if (isCollapsed(current, highWater, policy)) {
    return {
      _tag: isCollapsed(previous, highWater, policy) ? 'persisted' : 'awaiting_confirmation',
      current,
      highWater,
    }
  }
  if (isCollapsed(previous, highWater, policy))
    return { _tag: 'recovered_blip', current, highWater }
  return { _tag: 'none' }
}

export function compareCurrentSitemapScope(
  newestFirstCounts: ReadonlyArray<number | null | undefined>,
  policy: SitemapCollapsePolicy,
): CurrentSitemapScope | null {
  if (newestFirstCounts.length < 2)
    return null
  const current = Math.max(0, newestFirstCounts[0] ?? 0)
  const highWater = Math.max(
    0,
    ...newestFirstCounts.slice(1).map(value => Math.max(0, value ?? 0)),
  )
  return { current, highWater, collapsed: isCollapsed(current, highWater, policy) }
}

export function sitemapHistoryHasCollapse(
  newestFirstCounts: ReadonlyArray<number | null | undefined>,
  policy: SitemapCollapsePolicy,
): boolean {
  let highWater = 0
  for (const raw of newestFirstCounts.toReversed()) {
    const count = Math.max(0, raw ?? 0)
    if (isCollapsed(count, highWater, policy))
      return true
    highWater = Math.max(highWater, count)
  }
  return false
}

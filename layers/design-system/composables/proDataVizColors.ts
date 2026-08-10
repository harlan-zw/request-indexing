/**
 * Centralized data-visualization color system for the Pro dashboard.
 *
 * These are intentionally hardcoded Tailwind colors — they represent
 * metric identity (clicks=blue, impressions=purple), NOT semantic status.
 * For status/health/trend colors, use `proSemanticColors.ts` instead.
 */

export interface VizColorSet {
  dot: string
  bg: string
  text: string
  hex: string
}

/** GSC metric colors — the canonical color for each metric across all charts/tables */
export const gscMetricColors = {
  clicks: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', hex: '#3b82f6' },
  impressions: { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', hex: '#a855f7' },
  ctr: { dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-400', hex: '#34d399' },
  position: { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', hex: '#f97316' },
} as const satisfies Record<string, VizColorSet>

/** CWV metric colors */
export const cwvMetricColors = {
  lcp: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', hex: '#3b82f6' },
  inp: { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', hex: '#f97316' },
  cls: { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', hex: '#a855f7' },
} as const satisfies Record<string, VizColorSet>

/** Indexing chart colors */
export const indexingVizColors = {
  indexed: { dot: 'bg-green-500', bg: 'bg-green-500/10', text: 'text-green-400', hex: '#22c55e' },
  errors: { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', hex: '#f97316' },
  notIndexed: { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', hex: '#a855f7' },
} as const satisfies Record<string, VizColorSet>

/** Position distribution colors — the four position range buckets */
export const positionDistColors = {
  top3: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', hex: '#10b981' },
  page1: { dot: 'bg-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', hex: '#3b82f6' },
  page2: { dot: 'bg-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', hex: '#f59e0b' },
  deep: { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', hex: '#f97316' },
} as const satisfies Record<string, VizColorSet>

/** Keyword breadth bar color */
export const breadthVizColor = { dot: 'bg-purple-500', bg: 'bg-purple-500/60', text: 'text-purple-400', hex: '#a855f7' } as const satisfies VizColorSet

/** Brand term indicator color */
export const brandVizColor = { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', hex: '#a855f7' } as const satisfies VizColorSet

/** Generic color-key lookup for chart bar fills, toggle dots, legends */
export const vizColorMap: Record<string, VizColorSet> = {
  blue: gscMetricColors.clicks,
  purple: gscMetricColors.impressions,
  green: gscMetricColors.ctr,
  orange: gscMetricColors.position,
}

/** Dot-only lookup (common pattern: `<span class="size-1.5 rounded-full" :class="vizDotColor.blue" />`) */
export const vizDotColor: Record<string, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  green: 'bg-emerald-400',
  orange: 'bg-orange-500',
  cyan: 'bg-cyan-500',
}

/** Text-color lookup (for icons tinted by metric color key). */
export const vizTextColor: Record<string, string> = {
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  green: 'text-emerald-400',
  orange: 'text-orange-400',
  cyan: 'text-cyan-400',
}

/** Background-only lookup for bar fills */
export const vizBgColor: Record<string, string> = {
  blue: 'bg-blue-500/10',
  purple: 'bg-purple-500/10',
  green: 'bg-green-500/10',
  orange: 'bg-orange-500/10',
  cyan: 'bg-cyan-500/10',
}

/** Keyword preset colors — visual identity for filter presets (long-tail, high-volume, quick-wins) */
export const presetVizColors = {
  'long-tail': { dot: 'bg-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400', hex: '#06b6d4' },
  'high-volume': { dot: 'bg-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', hex: '#f97316' },
  'quick-wins': { dot: 'bg-emerald-400', bg: 'bg-emerald-400/10', text: 'text-emerald-400', hex: '#34d399' },
} as const satisfies Record<string, VizColorSet>

/** Period comparison colors — current vs previous/year-over-year */
export const periodVizColors = {
  current: { dot: 'bg-blue-500', bg: 'bg-blue-500/15', text: 'text-blue-400', hex: '#3b82f6' },
  comparison: { dot: 'bg-purple-500', bg: 'bg-purple-500/15', text: 'text-purple-400', hex: '#a855f7' },
} as const satisfies Record<string, VizColorSet>

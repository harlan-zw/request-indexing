// Pure helpers for chart annotations — the day-key matching + marker positioning
// extracted from UiChartFrame so they're unit-testable and shareable by every
// annotated chart (UiChartFrame's tooltip, the UiChartAnnotations marker overlay,
// and the CWV / indexing charts that compose unovis directly).

/**
 * A single chart annotation — a thin vertical marker line + interactive dot.
 * A plain UI shape any chart consumer can populate from any data source
 * (timeline events, deploy markers, …); the design system never imports the
 * domain that produces it.
 */
export interface ChartAnnotation {
  /** X position as a Date, ISO string, or epoch-ms number matching the chart's x domain. */
  x: number | string | Date
  /** Short label shown in the marker's native title + the chart tooltip. */
  label: string
  /** Optional producer-owned explanation or value shown below the label. */
  description?: string
  /**
   * Semantic tone that tints the marker (semantic CSS classes only).
   * 'success' → bg-success  'error' → bg-error  'warning' → bg-warning
   * 'neutral' (default) → bg-accented
   */
  tone?: 'success' | 'error' | 'warning' | 'neutral'
  /** Compact semantic or explicitly sourced icon rendered beside the marker dot. */
  icon?: string
  /** Stable producer id — lets marker affordances (edit/delete) address the row. */
  id?: string
  /** Optional link opened from the marker tooltip (http(s) only, producer-validated). */
  href?: string
  /**
   * User-authored marker: rendered with the editable glyph (square vs dot) and
   * offered edit/delete affordances by consumers that support them.
   */
  editable?: boolean
  /** Producer category token (e.g. 'release', 'custom') — opaque to the design system. */
  category?: string
  /** Original reporting day retained when a date annotation is re-anchored to an index x-axis. */
  dayKey?: string
}

/**
 * What ONE chart accepts, on top of whatever categories the caller treats as
 * global (every chart gets those for free — see `annotationInScope`'s
 * `rules.globalCategories`). Stays domain-opaque like `ChartAnnotation`
 * itself: the design system knows the SHAPE of a per-chart declaration, never
 * which category/kind strings a producer actually uses.
 */
export interface ChartAnnotationScope {
  /** Non-global categories this chart accepts (e.g. an 'algo-update' producer). */
  categories: readonly string[]
  /** Topic allow-list scoped to `rules.kindBearingCategory`. Omit to accept every kind within it. */
  kinds?: readonly string[]
}

/** The two facts a caller supplies about its own category vocabulary — see `annotationInScope`. */
export interface ChartAnnotationScopeRules {
  /** Categories every chart accepts regardless of `scope` (e.g. user notes, releases). */
  globalCategories: readonly string[]
  /** The one category whose annotations carry a producer `kind` for topic-level filtering. */
  kindBearingCategory: string
}

/**
 * True when `annotation` should render on a chart declaring `scope`. A chart
 * silently accepting every category it was never asked for is the bug this
 * closes (manual-review-2026-08 §Annotations: Search Console algorithm
 * updates rendering on a performance chart) — a category outside both
 * `rules.globalCategories` and `scope.categories` is rejected, full stop.
 */
export function annotationInScope(
  annotation: { category?: string, kind?: string },
  scope: ChartAnnotationScope,
  rules: ChartAnnotationScopeRules,
): boolean {
  const category = annotation.category
  if (category == null || rules.globalCategories.includes(category))
    return true
  if (!scope.categories.includes(category))
    return false
  if (category === rules.kindBearingCategory && scope.kinds)
    return annotation.kind != null && scope.kinds.includes(annotation.kind)
  return true
}

/** Marker icon count. Three is the visual ceiling; zero shows only the overflow count. */
export type ChartAnnotationIconLimit = 0 | 1 | 2 | 3

export interface ChartAnnotationOptions {
  /** Annotation icons shown beside the marker before a +N overflow count. Default 3. */
  maxIcons?: ChartAnnotationIconLimit
}

export interface ChartAnnotationControlItem<K extends string = string> {
  key: K
  label: string
  icon: string
  count?: number
  enabled: boolean
}

export const DEFAULT_ANNOTATION_ICON_LIMIT: ChartAnnotationIconLimit = 3

export function annotationIconPreview(
  items: readonly ChartAnnotation[],
  maxIcons: ChartAnnotationIconLimit = DEFAULT_ANNOTATION_ICON_LIMIT,
): { visible: readonly ChartAnnotation[], overflowCount: number } {
  return {
    visible: items.slice(0, maxIcons),
    overflowCount: Math.max(0, items.length - maxIcons),
  }
}

/** Semantic tone → marker tailwind background class (line + dot). */
export const ANNOTATION_TONE_CLASS: Record<NonNullable<ChartAnnotation['tone']>, string> = {
  success: 'bg-success',
  error: 'bg-error',
  warning: 'bg-warning',
  neutral: 'bg-accented',
}

function toMs(v: Date | string | number): number {
  if (v instanceof Date)
    return v.getTime()
  if (typeof v === 'number')
    return v
  return new Date(v).getTime()
}

/**
 * Normalise any x value to a `YYYY-MM-DD` day key.
 *
 * A `YYYY-MM-DD…` string keeps its own day verbatim (no Date round-trip, so no
 * UTC shift); a `Date`/epoch-ms is keyed by its **UTC** day.
 *
 * TIMEZONE NOTE (ADR-0082): chart x-domains here are GSC reporting days
 * (Pacific) rendered as UTC-midnight Dates, and an annotation's `x` is typically
 * an event instant (`occurredAt`, a UTC Date). Marker placement and the tooltip
 * match BOTH key off that UTC day, so the tooltip always matches the day the
 * marker is drawn on — they stay mutually consistent. The only artefact: a
 * detection-time event late in the Pacific evening keys one calendar day ahead
 * of the viewer's local day, and its marker sits on that same (next) day.
 */
export function toChartDayKey(v: Date | string | number): string {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v))
    return v.slice(0, 10)
  return new Date(toMs(v)).toISOString().slice(0, 10)
}

/** Annotations whose day matches the hovered x value (same `YYYY-MM-DD`). */
export function annotationsOnDay<T extends { x: Date | string | number }>(
  annotations: readonly T[],
  hoverX: Date | string | number | null | undefined,
): T[] {
  if (hoverX == null || !annotations.length)
    return []
  const day = toChartDayKey(hoverX)
  return annotations.filter(a => toChartDayKey(a.x) === day)
}

/**
 * The cheap diagnose line for a marker tooltip: "N days later, <metric> +X%".
 * Computed from the series already on screen (3-day means around the marker
 * day and `days` later) — the render-time half of the ROADMAP "tether" idea,
 * with zero backend. Returns undefined when the series doesn't extend far
 * enough past the marker or the baseline is zero.
 */
export function annotationImpactLine(
  series: readonly { date: string, value: number }[],
  markerX: Date | string | number,
  metricLabel: string,
  days = 7,
): string | undefined {
  if (series.length < days + 1)
    return undefined
  const day = toChartDayKey(markerX)
  const anchor = series.findIndex(row => toChartDayKey(row.date) >= day)
  if (anchor < 1 || anchor + days >= series.length)
    return undefined
  const mean = (end: number) => {
    const slice = series.slice(Math.max(0, end - 2), end + 1)
    return slice.reduce((sum, row) => sum + row.value, 0) / slice.length
  }
  // Baseline ends the day BEFORE the marker — the marker day itself already
  // carries the event's effect and would dilute the delta.
  const before = mean(anchor - 1)
  const after = mean(anchor + days)
  if (before <= 0)
    return undefined
  const pct = Math.round(((after - before) / before) * 100)
  if (!Number.isFinite(pct))
    return undefined
  return `${days} days later, ${metricLabel} ${pct >= 0 ? '+' : ''}${pct}%`
}

/**
 * The CSS `left` percentage for an annotation within a zero-horizontal-margin
 * plot (wrap width == plot x-span). Clamped to [0,100]. Returns '50%' for a
 * degenerate domain.
 */
export function annotationLeftPct(x: Date | string | number, domain: [Date | string | number, Date | string | number]): string {
  const xMs = toMs(x)
  const minMs = toMs(domain[0])
  const maxMs = toMs(domain[1])
  if (maxMs <= minMs)
    return '50%'
  const pct = Math.max(0, Math.min(100, ((xMs - minMs) / (maxMs - minMs)) * 100))
  return `${pct.toFixed(4)}%`
}

/**
 * Re-anchor annotations onto an INDEX-based x-axis (`x = (_d, i) => i`, e.g. the
 * CWV + indexing charts, whose bars are evenly spaced by array index rather than
 * by time). Maps each annotation's day to the data index sharing that day and
 * drops annotations with no matching data point. Pair with `xDomain = [0, len-1]`
 * so `UiChartAnnotations` positions markers on the right bar.
 */
export function indexAnnotationsByDay(
  annotations: readonly ChartAnnotation[] | undefined,
  days: readonly string[],
): ChartAnnotation[] {
  if (!annotations?.length || !days.length)
    return []
  const dayToIndex = new Map<string, number>()
  days.forEach((d, i) => {
    const key = toChartDayKey(d)
    if (!dayToIndex.has(key))
      dayToIndex.set(key, i)
  })
  return annotations.flatMap((a) => {
    const key = toChartDayKey(a.x)
    const i = dayToIndex.get(key)
    return i == null ? [] : [{ ...a, x: i, dayKey: key }]
  })
}

export interface ResolvedAnnotationMarker {
  id: number
  label: string
  description?: string
  leftPct: string
  toneClass: string
}

/** Resolve annotations to positioned markers; [] when no domain (silently skipped). */
export interface ResolvedAnnotationMarkerGroup {
  /** The shared day key (`YYYY-MM-DD`) — one marker per day. */
  id: string
  leftPct: string
  /** Dominant tone across the day's annotations (error > warning > success > neutral). */
  toneClass: string
  count: number
  /** True when any of the day's annotations is user-editable. */
  editable: boolean
  items: ChartAnnotation[]
}

const TONE_RANK: Record<NonNullable<ChartAnnotation['tone']>, number> = {
  error: 3,
  warning: 2,
  success: 1,
  neutral: 0,
}

/**
 * Day-grouped markers: annotations sharing a calendar day collapse into ONE
 * marker (a "+N" count pill signals the stack; the tooltip lists every item)
 * instead of piling identical lines on the same pixel column.
 */
export function resolveAnnotationMarkerGroups(
  annotations: readonly ChartAnnotation[] | undefined,
  xDomain: [Date | string | number, Date | string | number] | undefined,
): ResolvedAnnotationMarkerGroup[] {
  if (!annotations?.length || !xDomain)
    return []
  const byDay = new Map<string, ChartAnnotation[]>()
  for (const ann of annotations) {
    const day = ann.dayKey ?? toChartDayKey(ann.x)
    const bucket = byDay.get(day)
    if (bucket)
      bucket.push(ann)
    else
      byDay.set(day, [ann])
  }
  return Array.from(byDay.entries(), ([day, items]) => {
    const tone = items.reduce<NonNullable<ChartAnnotation['tone']>>((acc, item) =>
      TONE_RANK[item.tone ?? 'neutral'] > TONE_RANK[acc] ? (item.tone ?? 'neutral') : acc, 'neutral')
    return {
      id: day,
      leftPct: annotationLeftPct(items[0]!.x, xDomain),
      toneClass: ANNOTATION_TONE_CLASS[tone],
      count: items.length,
      editable: items.some(item => item.editable === true),
      items,
    }
  })
}

export function resolveAnnotationMarkers(
  annotations: readonly ChartAnnotation[] | undefined,
  xDomain: [Date | string | number, Date | string | number] | undefined,
): ResolvedAnnotationMarker[] {
  if (!annotations?.length || !xDomain)
    return []
  return annotations.map((ann, i) => ({
    id: i,
    label: ann.label,
    ...(ann.description ? { description: ann.description } : {}),
    leftPct: annotationLeftPct(ann.x, xDomain),
    toneClass: ANNOTATION_TONE_CLASS[ann.tone ?? 'neutral'],
  }))
}

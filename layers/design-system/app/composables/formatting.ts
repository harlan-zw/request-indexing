import type { ComputedRef, MaybeRef, Ref } from 'vue'
import { differenceInHours, formatDistanceToNow } from 'date-fns'
import { withoutTrailingSlash } from 'ufo'
import { computed, isRef } from 'vue'
import { semanticColors } from './semanticColors'

// `Intl.*` constructors are expensive; hoist to module scope so per-cell
// formatters across large tables reuse one instance instead of allocating
// a new one on every call.
// The app is English-only, so pin display formatting to one locale. Letting
// Node and the browser choose independently produced different compact suffixes
// (`1.2K` during SSR, `1.2k` in Chrome) and guaranteed hydration mismatches.
const DISPLAY_LOCALE = 'en-US'
const compactNumberFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { notation: 'compact', maximumFractionDigits: 1 })
// `narrowSymbol` keeps the "$" glyph (prices are USD) while still localising
// grouping/decimal separators, rather than degrading to the "USD" code in
// locales that disambiguate the dollar sign (e.g. en-AU).
const compactUsdFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', notation: 'compact', maximumFractionDigits: 1 })
const usdFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' })
const sitemapDateFormat = new Intl.DateTimeFormat(DISPLAY_LOCALE, { month: 'short', day: 'numeric', year: 'numeric' })
const relativeTimeFormatNarrow = new Intl.RelativeTimeFormat(DISPLAY_LOCALE, { numeric: 'auto', style: 'narrow' })
const relativeTimeFormatLong = new Intl.RelativeTimeFormat(DISPLAY_LOCALE, { numeric: 'auto', style: 'long' })
const signedPercentFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { style: 'percent', signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const ctrPercentFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const positionFormat = new Intl.NumberFormat(DISPLAY_LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Pure trend percentage between two values.
 * For metrics where lower is better (e.g. position), pass `invert: true`.
 * Returns 0 when prev is 0/null/undefined to avoid Infinity.
 */
export function calcTrendPercent(current: number, prev: number, invert = false): number {
  if (!prev)
    return 0
  const pct = Math.round(((current - prev) / prev) * 100) || 0
  return (invert ? -pct : pct) || 0
}

export function useProHumanFriendlyNumber(number: Ref<string | number>, decimals?: number): ComputedRef<string>
export function useProHumanFriendlyNumber(number: string | number, decimals?: number): string
export function useProHumanFriendlyNumber(number: MaybeRef<string | number | null | undefined>, decimals?: number) {
  const format = (number: number | null | undefined) => {
    if (!['number', 'string'].includes(typeof number))
      return '-'
    // Rounding through `Number.parseFloat(toFixed(n))` drops a trailing zero, so
    // a Position column printed `20` beside `6.2` and `5.8` and one column
    // carried two precisions. Let Intl hold the digit count instead, so every
    // value in a column has the same shape.
    if (typeof decimals !== 'undefined') {
      return new Intl.NumberFormat(DISPLAY_LOCALE, {
        notation: 'compact',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(Number(number))
    }
    return compactNumberFormat.format(Number(number))
  }
  if (isRef(number)) {
    return computed(() => {
      return format(Number(number.value))
    })
  }
  return format(Number(number))
}

export const useHumanFriendlyNumber = useProHumanFriendlyNumber

/**
 * Relative distance from now, signed. `narrow` ("in 3d", "5m ago") is the
 * default for dense cells; `long` ("in 3 days") reads as a sentence where the
 * value stands alone, such as a scheduled send.
 */
export function formatTimeAgo(timestamp: number | string | Date | null | undefined, style: 'narrow' | 'long' = 'narrow') {
  if (!timestamp)
    return null
  const relativeTimeFormat = style === 'long' ? relativeTimeFormatLong : relativeTimeFormatNarrow
  // A raw `number` may be unix SECONDS (our `mode:'timestamp'` columns) or unix
  // MILLISECONDS (the raw-`integer` audit columns — billingEvents / adminEvents /
  // loginEvents / runtimeErrors, ADR-0082). Disambiguate by magnitude: seconds for
  // any plausible date are < 1e11, ms are ≥ 1e12. Both render as the same instant.
  const date = typeof timestamp === 'number'
    ? new Date(timestamp < 1e11 ? timestamp * 1000 : timestamp)
    : new Date(timestamp)
  // Result is relative to the current time, so it differs between SSR and
  // client render — callers showing this in initial HTML should wrap it in
  // <ClientOnly> to avoid a hydration mismatch.
  // Signed distance, so a FUTURE date reads forward ("in 6 days"). It used to
  // subtract one way only, so every future date fell through `minutes < 1` and
  // rendered as "just now" — a 7-day invitation expiry announced itself as
  // already expiring.
  const diff = Date.now() - date.getTime()
  const ahead = diff < 0
  const distance = Math.abs(diff)
  const minutes = Math.floor(distance / 60000)
  const hours = Math.floor(distance / 3600000)
  const days = Math.floor(distance / 86400000)
  const signed = (n: number) => ahead ? n : -n
  if (minutes < 1)
    return 'just now'
  if (minutes < 60)
    return relativeTimeFormat.format(signed(minutes), 'minute')
  if (hours < 24)
    return relativeTimeFormat.format(signed(hours), 'hour')
  if (days < 30)
    return relativeTimeFormat.format(signed(days), 'day')
  const months = Math.floor(days / 30)
  if (months < 12)
    return relativeTimeFormat.format(signed(months), 'month')
  return relativeTimeFormat.format(signed(Math.floor(days / 365)), 'year')
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null)
    return '—'
  return compactNumberFormat.format(n)
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null)
    return '—'
  return compactUsdFormat.format(n)
}

// `n` is a percentage-point value (e.g. 5 → "+5.0%"), so divide before the
// percent formatter (which multiplies by 100).
export function formatPercent(n: number): string {
  return signedPercentFormat.format(n / 100)
}

export function formatCurrencyFromCents(cents: number | null | undefined): string {
  if (cents == null)
    return '—'
  return usdFormat.format(cents / 100)
}

// GSC metric formatter (replaces duplicated fmtMetric across SC pages)
export function fmtGscMetric(val: number, metric: string): string {
  if (metric === 'ctr')
    return ctrPercentFormat.format(val)
  if (metric === 'position')
    return positionFormat.format(val)
  return formatNumber(val)
}

// Color utilities
export function getDifficultyColor(d: number | null): string {
  if (d == null)
    return 'bg-accented text-muted'
  if (d <= 30)
    return 'bg-success/10 text-success'
  if (d <= 60)
    return 'bg-warning/10 text-warning'
  return 'bg-error/10 text-error'
}

export function getDifficultyInfo(kd: number | null): { label: string, color: string, bg: string, description: string } {
  if (kd === null)
    return { label: '—', color: 'text-muted', bg: 'bg-accented', description: 'No difficulty data' }
  if (kd <= 20)
    return { label: 'Easy', color: 'text-success', bg: 'bg-success/15', description: 'Low competition – great opportunity' }
  if (kd <= 40)
    return { label: 'Low', color: 'text-success', bg: 'bg-success/15', description: 'Achievable with quality content' }
  if (kd <= 60)
    return { label: 'Medium', color: 'text-warning', bg: 'bg-warning/15', description: 'Needs strong content + backlinks' }
  if (kd <= 80)
    return { label: 'Hard', color: 'text-warning', bg: 'bg-warning/15', description: 'Requires niche authority' }
  return { label: 'Very Hard', color: 'text-error', bg: 'bg-error/15', description: 'Dominated by major sites' }
}

export function getDomainRankColor(rank: number | null | undefined): string {
  if (!rank)
    return 'text-muted'
  if (rank >= 70)
    return 'text-success'
  if (rank >= 40)
    return 'text-warning'
  return 'text-error'
}

export function trendColor(change: number | null): string {
  if (!change)
    return semanticColors.neutral.hex
  return change > 0 ? semanticColors.success.hex : semanticColors.error.hex
}

// URL/path helpers
export function getPath(url: string): string {
  if (!url?.startsWith('http'))
    return url || '/'
  return new URL(url).pathname || '/'
}

export function getSitemapName(path: string): string {
  try {
    return new URL(path).pathname || path
  }
  catch {
    return path
  }
}

export function formatSitemapDate(dateStr: string | null | undefined): string {
  if (!dateStr)
    return 'Never'
  return sitemapDateFormat.format(new Date(dateStr))
}

// --- Reporting-day buckets (GSC/analytics daily rows keyed "YYYY-MM-DD") ---
// These are calendar-day LABELS owned by the data source (GSC buckets in Pacific
// Time), not instants. We never shift them into the viewer's timezone — doing so
// is the off-by-one-day bug. Parse in a fixed UTC frame so the round-trip is
// identity, and ALWAYS format with `timeZone: 'UTC'` so the label never drifts.
// See ADR-0082. The `Z`/UTC here is a neutral frame for an opaque label, not a
// claim that the data is UTC.
const reportingDayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })

/** Parse a "YYYY-MM-DD" reporting-day label into a stable, viewer-independent Date. */
export function parseReportingDay(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

/**
 * Format a "YYYY-MM-DD" reporting-day label. Defaults to "Jun 24"; pass `opts` for
 * other shapes — `timeZone: 'UTC'` is forced so the label can't drift per viewer.
 */
export function formatReportingDay(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso)
    return '—'
  if (opts)
    return new Intl.DateTimeFormat(undefined, { ...opts, timeZone: 'UTC' }).format(parseReportingDay(iso))
  return reportingDayFormat.format(parseReportingDay(iso))
}

/* ── Request Indexing additions ───────────────────────────────────────────────
   Search Console property handling and indexing recency. No nuxtseo.com
   equivalent; keep them here so the shared helpers above stay a clean resync. */

/** Milliseconds as `240ms` under a second, `1.4s` above it. */
export function useHumanMs(ms: number): string {
  if (ms < 1000)
    return `${Number(ms).toFixed(0)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function useFriendlySiteUrl(url: string): string
export function useFriendlySiteUrl(url: Ref<string>): ComputedRef<string>
export function useFriendlySiteUrl(url: MaybeRef<string>) {
  const format = (s: string) => withoutTrailingSlash(
    s.replace('https://', '')
      .replace('sc-domain:', '')
      .replace('www.', ''),
  )
  if (isRef(url))
    return computed(() => format(url.value))
  return format(url)
}

/**
 * Display label for a site.
 *
 * `sites.domain` is nullable: rows imported from the old KV store carry only a
 * Search Console `property` (`https://unhead.unjs.io/`, `sc-domain:nuxtseo.com`).
 * Components used to read `site.domain` directly, which threw
 * "Cannot read properties of null (reading 'replace')" the moment such a site
 * reached the dashboard, and the `site.domain || ''` guards elsewhere rendered a
 * blank label instead. Route every label through here so neither is possible.
 */
export function siteLabel(site: { domain?: string | null, property?: string | null }): string {
  const source = site.domain || site.property || ''
  // `withoutTrailingSlash('')` returns `/`, so a site with neither field used to
  // produce a truthy `/` label. Callers read that as a real host: the favicon
  // proxy was asked for `?domain=/` instead of falling back to the globe icon.
  if (!source)
    return ''
  return useFriendlySiteUrl(source)
}

/**
 * Strips the Search Console `sc-domain:` prefix, leaving a bare hostname for
 * the favicon proxy. `sites.domain` is a nullable column, so a null hostname
 * reaches components; callers passed it to `domain.replace` and threw
 * "Cannot read properties of null (reading 'replace')". A missing domain
 * returns `''` so the component can fall back to a globe icon instead.
 */
export function cleanDomain(domain: string | null | undefined): string {
  if (!domain)
    return ''
  return domain.replace(/^sc-domain:/, '')
}

/**
 * Recency of an indexing event. Under an hour reads as a distance ("5 minutes
 * ago"); past that it counts whole hours, which is the grain Search Console
 * itself reports. `absAgo` forces the distance form.
 */
export function formatIndexingTimeAgo(date: string | number, absAgo?: boolean): string
export function formatIndexingTimeAgo(date: Ref<string | number>, absAgo?: boolean): ComputedRef<string>
export function formatIndexingTimeAgo(date: MaybeRef<string | number>, absAgo?: boolean) {
  const format = (_d: string | number) => {
    const d = new Date(_d)
    const hourDiff = differenceInHours(new Date(), d)
    if (hourDiff < 1 || absAgo)
      return formatDistanceToNow(d, { addSuffix: true })
    return `${hourDiff} hours ago`
  }
  if (isRef(date))
    return computed(() => format(date.value))
  return format(date)
}

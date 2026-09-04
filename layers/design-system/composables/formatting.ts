import type { ComputedRef, MaybeRef, Ref } from 'vue'
import { differenceInCalendarMonths, differenceInHours, formatDistanceToNow } from 'date-fns'
import { withoutTrailingSlash } from 'ufo'

export function useHumanFriendlyNumber(number: Ref<string | number>, decimals?: number): ComputedRef<string>
export function useHumanFriendlyNumber(number: string | number, decimals?: number): string
export function useHumanFriendlyNumber(number: MaybeRef<string | number | null | undefined>, decimals?: number): ComputedRef<string> | string {
  const format = (number: number | null | undefined) => {
    // if not a number
    if (!['number', 'string'].includes(typeof number))
      return '-'
    // O3: this used to round via `parseFloat(toFixed(n))`, which drops a
    // trailing zero. A Position column then printed `20` beside `6.2` and `5.8`,
    // so one column carried two precisions. Let Intl hold the digit count
    // instead, so every value in a column has the same shape.
    if (typeof decimals !== 'undefined') {
      return new Intl.NumberFormat('en', {
        notation: 'compact',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(Number(number))
    }
    return new Intl.NumberFormat('en', { notation: 'compact' }).format(Number(number))
  }
  if (isRef(number)) {
    return computed(() => {
      return format(Number(number.value))
    })
  }
  // use intl to format the number, should have `k` or `m` suffix if needed
  return format(Number(number))
}

export function useHumanMs(ms: number): string {
  // need to convert it such < 1000 we say $x ms, otherwise we say $x s
  if (ms < 1000)
    return `${Number(ms).toFixed(0)}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function useHumanMsRaw(ms: number): string {
  // need to convert it such < 1000 we say $x ms, otherwise we say $x s
  if (ms < 1000)
    return `${Number(ms).toFixed(0)}`
  return `${(ms / 1000).toFixed(1)}`
}

export function useFriendlySiteUrl(url: string): string
export function useFriendlySiteUrl(url: MaybeRef<string>) {
  const format = (s: string) => withoutTrailingSlash(
    s.replace('https://', '')
      .replace('sc-domain:', '')
      .replace('www.', ''),
  )
  if (isRef(url)) {
    return computed(() => {
      return format(url.value)
    })
  }
  // use intl to format the number, should have `k` or `m` suffix if needed
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

export function formatIndexingTimeAgo(date: string | number, absAgo?: boolean): string
export function formatIndexingTimeAgo(date: MaybeRef<string | number>, absAgo?: boolean): string | ComputedRef<string> {
  const format = (_d: string | number) => {
    const d = new Date(_d)
    const hourDiff = differenceInHours(new Date(), d)
    if (hourDiff < 1 || absAgo)
      return formatDistanceToNow(d, { addSuffix: true })
    return `${hourDiff} hours ago`
  }
  if (isRef(date)) {
    return computed(() => {
      return format(date.value)
    })
  }
  return format(date)
}

export function useTimeHoursAgo(date: string): number
export function useTimeHoursAgo(date: MaybeRef<string>): number | ComputedRef<number> {
  const format = (_d: string) => {
    return differenceInHours(new Date(), new Date(_d))
  }
  if (isRef(date)) {
    return computed(() => {
      return format(date.value)
    })
  }
  return format(date)
}

export function useTimeMonthsAgo(date: string): number
export function useTimeMonthsAgo(date: MaybeRef<string>): number | ComputedRef<number> {
  const format = (_d: string) => {
    return differenceInCalendarMonths(new Date(), new Date(_d))
  }
  if (isRef(date)) {
    return computed(() => {
      return format(date.value)
    })
  }
  return format(date)
}

import type { Ref } from '@vue/reactivity'
import type { type ComputedRef, MaybeRef } from 'vue'
import { withoutTrailingSlash } from 'ufo'

function useHumanFriendlyNumber(number: Ref<number>, decimals?: number): ComputedRef<string>
function useHumanFriendlyNumber(number: number, decimals?: number): string
export function useHumanFriendlyNumber(number: MaybeRef<number | null | undefined>, decimals?: number) {
  const format = (number: number | null | undefined) => {
    // if not a number
    if (!['number', 'string'].includes(typeof number))
      return '-'
    // apply decimals if defined
    if (typeof decimals !== 'undefined')
      number = Number.parseFloat(number.toFixed(decimals))
    return new Intl.NumberFormat('en', { notation: 'compact' }).format(number)
  }
  if (isRef(number)) {
    return computed(() => {
      return format(number.value)
    })
  }
  // use intl to format the number, should have `k` or `m` suffix if needed
  return format(number)
}

export function useHumanMs(ms: number): string {
  // need to convert it such < 1000 we say $x ms, otherwise we say $x s
  if (ms < 1000)
    return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export function useFriendlySiteUrl(url: string): string
export function useFriendlySiteUrl(url: MaybeRef<string>) {
  const format = (s: string) => withoutTrailingSlash(
    s.replace('https://', '')
      .replace('sc-domain:', ''),
  )
  if (isRef(url)) {
    return computed(() => {
      return format(url.value)
    })
  }
  // use intl to format the number, should have `k` or `m` suffix if needed
  return format(url)
}

export function useTimeAgo(date: string, absAgo?: boolean): string
export function useTimeAgo(date: MaybeRef<string>, absAgo?: boolean): string {
  const format = (_d: string) => {
    const dayjsGmt = useDayjs().utc
    const d = dayjsGmt(_d)
    const hourDiff = dayjsGmt().diff(d, 'hour')
    if (hourDiff < 1 || absAgo)
      return d.fromNow()
    return `${hourDiff} hours ago`
  }
  if (isRef(date)) {
    return computed(() => {
      return format(date.value)
    })
  }
  return format(date)
}

export function useTimeHoursAgo(date: string): string
export function useTimeHoursAgo(date: MaybeRef<string>) {
  const format = (_d: string) => {
    const d = useDayjs()(_d)
    return useDayjs()().diff(d, 'hour')
  }
  if (isRef(date)) {
    return computed(() => {
      return format(date.value)
    })
  }
  return format(date)
}

export function useTimeMonthsAgo(date: string): string
export function useTimeMonthsAgo(date: MaybeRef<string>) {
  const format = (_d: string) => {
    const d = useDayjs()(_d)
    return useDayjs()().diff(d, 'month')
  }
  if (isRef(date)) {
    return computed(() => {
      return format(date.value)
    })
  }
  return format(date)
}

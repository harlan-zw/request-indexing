import type { ComputedRef, MaybeRef } from 'vue'

export function useProHumanFriendlyNumber(number: Ref<string | number>, decimals?: number): ComputedRef<string>
export function useProHumanFriendlyNumber(number: string | number, decimals?: number): string
export function useProHumanFriendlyNumber(number: MaybeRef<string | number | null | undefined>, decimals?: number) {
  const format = (number: number | null | undefined) => {
    if (!['number', 'string'].includes(typeof number))
      return '-'
    if (typeof decimals !== 'undefined')
      number = Number.parseFloat(Number(number).toFixed(decimals))
    return new Intl.NumberFormat('en', { notation: 'compact' }).format(Number(number))
  }
  if (isRef(number)) {
    return computed(() => {
      return format(Number(number.value))
    })
  }
  return format(Number(number))
}

export function formatProTimeAgo(timestamp: number | string | Date | null | undefined) {
  if (!timestamp)
    return null
  const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1)
    return 'just now'
  if (minutes < 60)
    return `${minutes}m ago`
  if (hours < 24)
    return `${hours}h ago`
  if (days < 30)
    return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12)
    return `${months}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null)
    return '—'
  if (n >= 1000000)
    return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)
    return `${(n / 1000).toFixed(1)}K`
  return String(n)
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null)
    return '—'
  if (n >= 1000000)
    return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000)
    return `$${(n / 1000).toFixed(1)}K`
  return `$${Math.round(n)}`
}

export function formatPercent(n: number): string {
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(1)}%`
}

export function formatCurrencyFromCents(cents: number | null | undefined): string {
  if (cents == null)
    return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

// GSC metric formatter (replaces duplicated fmtMetric across SC pages)
export function fmtGscMetric(val: number, metric: string): string {
  if (metric === 'ctr')
    return `${(val * 100).toFixed(1)}%`
  if (metric === 'position')
    return val.toFixed(1)
  return formatNumber(val)
}

// Chart color constants (replaces 3x duplicated deviceColorMap + countryDonutColors)
export const gscDeviceColors: Record<string, { bg: string, hex: string }> = {
  desktop: { bg: 'bg-blue-400', hex: '#60a5fa' },
  mobile: { bg: 'bg-green-400', hex: '#4ade80' },
  tablet: { bg: 'bg-amber-400', hex: '#fbbf24' },
}

export const gscCountryDonutColors = ['#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a78bfa']

export const gscBrandSplitColors = {
  brand: { bg: 'bg-violet-500', hex: '#8b5cf6' },
  nonBrand: { bg: 'bg-emerald-500', hex: '#10b981' },
}

// Top pages stacked area chart colors (6 slots: 5 pages + "other")
// Uses canonical data viz palette from proDataVizColors.ts
export const gscTopPagesColors = [
  { bg: 'bg-blue-500', hex: '#3b82f6' },
  { bg: 'bg-purple-500', hex: '#a855f7' },
  { bg: 'bg-emerald-400', hex: '#34d399' },
  { bg: 'bg-orange-500', hex: '#f97316' },
  { bg: 'bg-cyan-500', hex: '#06b6d4' },
  { bg: 'bg-accented', hex: '#94a3b880' }, // "Other"
]

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

// calcTrendPercent now lives in `pro-saas/shared/period.ts` as part of the isomorphic
// period seam. Re-exported here so existing imports keep working.
export { calcTrendPercent } from '#layers/pro-saas/shared/period'

export function trendColor(change: number | null): string {
  if (!change)
    return '#374151'
  return change > 0 ? '#057a55' : '#dc2626'
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
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Country helpers - delegate to canonical source in utils/countries.ts
export { countryCodeToFlagIcon as countryFlag, getCountryName as countryName } from '../utils/countries'

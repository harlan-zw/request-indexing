import type { MaybeRefOrGetter } from 'vue'
import type { GscdumpDataRow } from '../../../shared/gscdump-api'
import type { CompareMode, Period } from '../useGscPeriod'
import { computed, ref, toValue } from 'vue'
import { useProGscdumpTableData } from './useProGscdumpTableData'

/**
 * Lazy variant breakdown for the query label's variant badge.
 *
 * A canonical query row carries only the variant count. The raw queries that
 * folded into it are a second read, so opening the badge runs one `query`
 * breakdown faceted to that canonical and the popover shows the actual variants
 * instead of a sentence describing them.
 *
 * One instance serves every row on a surface: only the open canonical is
 * fetched, and nothing fires until a badge opens, because the underlying table
 * query stays idle while its site id is undefined.
 */
export interface ProGscQueryVariantRow {
  query: string
  clicks: number
  impressions: number
  position: number
}

export interface UseProGscQueryVariantsOptions {
  /** Default gscdump site id. */
  siteId?: MaybeRefOrGetter<string | undefined | null>
  period?: MaybeRefOrGetter<Period>
  stableData?: MaybeRefOrGetter<boolean>
  compareMode?: MaybeRefOrGetter<CompareMode>
  /** Variants fetched per open. The popover scrolls past about six rows. */
  limit?: number
}

export interface ProGscQueryVariants {
  open: (canonical: string, siteId?: string | null) => void
  /** The row's variants, `undefined` unless this row's popover is the open one. */
  variantsFor: (canonical?: string | null, siteId?: string | null) => ProGscQueryVariantRow[] | undefined
  loadingFor: (canonical?: string | null, siteId?: string | null) => boolean
}

export function useProGscQueryVariants(options: UseProGscQueryVariantsOptions = {}): ProGscQueryVariants {
  const { limit = 10 } = options

  const openCanonical = ref<string | null>(null)
  // Per-row site id for multi-site surfaces; null means the options default.
  const openSiteId = ref<string | null>(null)

  // Undefined until a popover opens, so no request fires on mount.
  const targetSiteId = computed<string | undefined>(() => {
    if (!openCanonical.value)
      return undefined
    return openSiteId.value ?? toValue(options.siteId) ?? undefined
  })

  const { rows, isLoading } = useProGscdumpTableData<GscdumpDataRow>({
    siteId: targetSiteId,
    dimension: 'query',
    period: options.period,
    stableData: options.stableData,
    compareMode: options.compareMode,
    facets: computed(() => openCanonical.value
      ? [{ column: 'queryCanonical' as const, op: 'eq' as const, value: openCanonical.value }]
      : undefined),
    pageSize: limit,
    defaultSort: { column: 'clicks', direction: 'desc' },
  })

  const variants = computed<ProGscQueryVariantRow[]>(() => rows.value.map(r => ({
    query: r.query ?? '',
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    position: r.position ?? 0,
  })))

  function isOpenRow(canonical?: string | null, siteId?: string | null): boolean {
    if (!canonical || openCanonical.value !== canonical)
      return false
    if (siteId && openSiteId.value)
      return openSiteId.value === siteId
    return true
  }

  return {
    open(canonical, siteId) {
      openSiteId.value = siteId || null
      openCanonical.value = canonical || null
    },
    variantsFor(canonical, siteId) {
      return isOpenRow(canonical, siteId) ? variants.value : undefined
    },
    loadingFor(canonical, siteId) {
      return isOpenRow(canonical, siteId) && isLoading.value
    },
  }
}

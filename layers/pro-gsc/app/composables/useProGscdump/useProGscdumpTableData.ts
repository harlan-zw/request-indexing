import type {
  BuilderState,
  GscComparisonFilter,
  GscdumpDataResponse,
  GscdumpDataRow,
} from '../../../shared/gscdump-api'
import type { CompareMode, Period } from '../useGscPeriod'
import { andFilter, dateFilter } from '../../../shared/utils/filter-wire'
import { compareRange, periodToDateRange } from '../useGscPeriod'
import { useProGscdumpData } from './useProGscdumpData'

export interface ProGscdumpTableOptions {
  siteId: MaybeRefOrGetter<string | undefined>
  dimension: 'page' | 'query' | 'queryCanonical' | 'country' | 'device' | 'date'
  period?: MaybeRefOrGetter<Period>
  stableData?: MaybeRefOrGetter<boolean>
  compareMode?: MaybeRefOrGetter<CompareMode>
  pageSize?: number
  defaultSort?: { column: string, direction: 'asc' | 'desc' }
  extraFilters?: MaybeRefOrGetter<Array<{ type: string, column: string, value: string }> | undefined>
}

/**
 * Consumer-owned table state backed by the typed v1 analytics report.
 * Replaces the table composable that disappeared with the retired Nuxt layer.
 */
export function useProGscdumpTableData<T = GscdumpDataRow>(options: ProGscdumpTableOptions) {
  const { dimension, pageSize = 50 } = options
  const _siteId = computed(() => toValue(options.siteId) ?? '')
  const _period = computed(() => toValue(options.period) ?? '28d')
  const _stableData = computed(() => toValue(options.stableData) ?? true)
  const _compareMode = computed(() => toValue(options.compareMode) ?? 'previous')
  const _extraFilters = computed(() => toValue(options.extraFilters) ?? [])

  const q = ref('')
  const page = ref(1)
  const filter = ref<GscComparisonFilter | 'default'>('default')
  const sort = ref(options.defaultSort ?? { column: 'clicks', direction: 'desc' as const })

  const range = computed(() => periodToDateRange(_period.value, _stableData.value))
  const comparisonRange = computed(() => compareRange(range.value, _compareMode.value))
  const state = computed<BuilderState>(() => ({
    dimensions: [dimension],
    filter: andFilter(
      dateFilter(range.value),
      q.value ? { type: 'contains', column: dimension, value: q.value } : null,
      ..._extraFilters.value,
    ),
    orderBy: { column: sort.value.column, dir: sort.value.direction } as BuilderState['orderBy'],
    rowLimit: pageSize,
    startRow: (page.value - 1) * pageSize,
  }))
  const comparison = computed<BuilderState | undefined>(() => comparisonRange.value
    ? {
        dimensions: [dimension],
        filter: andFilter(
          dateFilter(comparisonRange.value),
          q.value ? { type: 'contains', column: dimension, value: q.value } : null,
          ..._extraFilters.value,
        ),
      }
    : undefined)

  const query = useProGscdumpData(_siteId, state, {
    comparison,
    filter: computed(() => filter.value === 'default' ? undefined : filter.value),
  })
  const rows = computed(() => (query.data.value?.rows ?? []) as T[])
  const total = computed(() => query.data.value?.totalCount ?? 0)
  const data = computed<GscdumpDataResponse | null>(() => query.data.value)

  function setPage(newPage: number) {
    page.value = newPage
  }

  function setSort(column: string, direction: 'asc' | 'desc' = 'desc') {
    sort.value = { column, direction }
    page.value = 1
  }

  function toggleSort(column: string) {
    setSort(column, sort.value.column === column && sort.value.direction === 'desc' ? 'asc' : 'desc')
  }

  function toggleFilter(newFilter: GscComparisonFilter | 'default') {
    filter.value = filter.value === newFilter ? 'default' : newFilter
    page.value = 1
  }

  return {
    q,
    page,
    filter,
    sort,
    isLoading: query.pending,
    error: query.error,
    status: query.status,
    data,
    rows,
    total,
    pageSize,
    refresh: query.refresh,
    toggleFilter,
    setPage,
    setSort,
    toggleSort,
  }
}

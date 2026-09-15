<script setup lang="ts">
import type { GscdumpDataRow } from '@gscdump/contracts'
import type { CellContext } from '@tanstack/vue-table'
import type { UiTableColumn, UiTableFeatures } from '~~/layers/design-system/app/shared/table'
import type { Period } from '../../../composables/useGscPeriod'
import { useRoute } from 'nuxt/app'
import { computed, h, watchEffect } from 'vue'
import { UiProgressPercent } from '#components'
import { deriveUrlBrandKeywords } from '../../../../shared/brand-queries'
import { isBrandTerm } from '../../../../shared/query-display'
import ProGscTableShell from '../../../components/pro/ProGscTableShell.vue'
import ProQueryLabel from '../../../components/pro/ProQueryLabel.vue'
import { periodToDateRange } from '../../../composables/useGscPeriod'
import {
  useProEntitySparklines,
  useProGscdumpTableData,
  useProGscQueryVariants,
  useProTopAssociations,
} from '../../../composables/useProGscdump'
import { buildBrandFacet, buildQuestionFacet, useProGscFilters } from '../../../composables/useProGscFilters'
import { createProGscColumns, getProGscColumnKey } from '../../composables/createProGscColumns'
import { useGscBackfill } from '../../composables/useGscBackfill'
import ProSparklineCell from './ProSparklineCell.vue'
import ProTopPageCell from './ProTopPageCell.vue'

interface KeywordTableRow extends GscdumpDataRow {
  id: string
}

const {
  siteId,
  siteUrl,
  gscdumpSiteId,
  brandTerms,
  pageSize = 12,
  period = '28d',
  searchable = true,
  sortable = true,
  sort: sortProp,
  excludeColumns,
  pageFilter,
  loadMore = true,
} = defineProps<{
  /** The site's public id, used for the row links. */
  siteId: string
  /** The site URL, used to derive brand terms when none are supplied. */
  siteUrl?: string | null
  gscdumpSiteId: string | null | undefined
  /** Brand terms for the brand badge and the Brand facet. */
  brandTerms?: readonly string[]
  pageSize?: number
  period?: Period
  searchable?: boolean
  sortable?: boolean
  pagination?: boolean
  /** Accumulating load-more footer instead of a fixed top-N. */
  loadMore?: boolean
  sort?: { column: string, direction: 'asc' | 'desc' }
  excludeColumns?: string[]
  /** Narrow the queries to one page URL. */
  pageFilter?: string
}>()

const emit = defineEmits<{ available: [value: boolean] }>()

const gscFilters = useProGscFilters()
const route = useRoute()
const linkSiteId = computed(() => (route.params.id as string) || siteId)
const dateRange = computed(() => periodToDateRange(period, gscFilters.stableData.value))

// No keyword profile exists yet, so brand terms fall back to what the site URL
// deterministically implies. A caller that knows better passes `brandTerms`.
const brandKeywords = computed(() => (brandTerms?.length ? [...brandTerms] : deriveUrlBrandKeywords(siteUrl)))

// A page-filtered table already breaks down by raw query, so a row IS a
// variant and the canonical grouping would collapse the answer.
const dimension = computed(() => pageFilter ? 'query' as const : 'queryCanonical' as const)

const queryFacets = computed(() => {
  const list = [
    buildBrandFacet(gscFilters.brand.value, brandKeywords.value),
    buildQuestionFacet(gscFilters.questions.value),
    ...(pageFilter ? [{ column: 'page' as const, op: 'eq' as const, value: pageFilter }] : []),
  ].filter((f): f is NonNullable<typeof f> => !!f)
  return list.length ? list : undefined
})

const {
  q,
  page,
  filter,
  sort,
  isLoading,
  isLoadingMore,
  error,
  rows,
  total,
  loadedCount,
  hasMore,
  loadMore: onLoadMore,
  data,
  refresh,
  toggleFilter,
  toggleSort,
} = useProGscdumpTableData<GscdumpDataRow>({
  siteId: computed(() => gscdumpSiteId ?? undefined),
  dimension: dimension.value,
  period: computed(() => period),
  stableData: gscFilters.stableData,
  compareMode: gscFilters.compareMode,
  pageSize,
  loadMore,
  initFilterFromUrl: true,
  defaultSort: sortProp ?? { column: 'clicks', direction: 'desc' },
  // Sort the Query column by the text the user reads. The server can only rank
  // by a metric, so this one happens client-side.
  dimensionSortAccessor: (r: GscdumpDataRow) => r.queryCanonical || r.query || '',
  facets: queryFacets,
})

watchEffect(() => emit('available', !isLoading.value && !error.value && rows.value.length > 0))

// These two say clicks, not rankings, because that is what they select on. A
// query whose rank collapsed while its clicks held never appears here; the
// falling badge on the query label reports that move instead.
const filters = [
  { key: 'new', label: 'New', icon: 'ai', tooltip: 'Queries that appeared for the first time in this period' },
  { key: 'lost', label: 'Lost', icon: 'trending-down', tooltip: 'Queries that no longer appear in this period' },
  { key: 'improving', label: 'Improving', icon: 'trending-up', tooltip: 'Queries that gained clicks compared to the previous period' },
  { key: 'declining', label: 'Declining', icon: 'down', tooltip: 'Queries that lost clicks compared to the previous period' },
]

const backfill = useGscBackfill()
watchEffect(() => {
  const id = gscdumpSiteId
  const meta = data.value?.meta
  if (id && meta)
    backfill.maybeTrigger(meta, id, refresh)
})

const { clicksColumn, clicksChangeColumn, impressionsColumn, ctrColumn, positionColumn, newBadge, dash } = createProGscColumns<KeywordTableRow>(() => !!data.value?.hasPrevData)

function rowQuery(r: GscdumpDataRow): string {
  return r.queryCanonical || r.query || ''
}

const queryKeys = computed(() => rows.value.map(rowQuery).filter(Boolean))

// The variant badge resolves the raw queries folded into a canonical when its
// popover opens, so a table of 25 rows costs nothing until one is asked about.
const queryVariants = useProGscQueryVariants({
  siteId: computed(() => gscdumpSiteId ?? undefined),
  period: computed(() => period),
  stableData: gscFilters.stableData,
  compareMode: gscFilters.compareMode,
})

const topPages = useProTopAssociations({
  gscdumpSiteId: computed(() => gscdumpSiteId ?? undefined),
  range: dateRange,
  group: dimension.value,
  keys: queryKeys,
})

const sparkMetric = computed(() => gscFilters.columns.value[0] === 'clicks' ? 'clicks' : 'impressions')
const sparklines = useProEntitySparklines({
  gscdumpSiteId: computed(() => gscdumpSiteId ?? undefined),
  range: dateRange,
  dimension: dimension.value,
  keys: queryKeys,
  metric: sparkMetric,
  facets: queryFacets,
})

function isBrandKeyword(query: string) {
  return isBrandTerm(query, brandKeywords.value)
}

const tableData = computed<KeywordTableRow[]>(() => rows.value
  .filter(r => rowQuery(r))
  .map((r, i) => ({ ...r, id: rowQuery(r) || String(i) })))

const columns = computed<UiTableColumn<KeywordTableRow>[]>(() => {
  const allCols: UiTableColumn<KeywordTableRow>[] = [
    {
      accessorKey: 'keyword',
      header: 'Query',
      tooltip: 'The search term users type into Google',
      enableSorting: sortable,
      rowHeader: true,
      ui: { td: { base: 'max-w-0 w-full' } },
      cell: ({ row }: CellContext<UiTableFeatures, KeywordTableRow, unknown>) => {
        const r = row.original
        const query = rowQuery(r)
        return h('div', { class: 'flex items-center gap-3 min-w-0' }, [
          h('div', { class: 'relative min-w-0 flex-1' }, [
            h(UiProgressPercent, { value: r.clicks, total: data.value?.totalClicks }, () => [
              h(ProQueryLabel, {
                keyword: query,
                queryCanonical: r.queryCanonical,
                variantCount: r.variantCount,
                variants: queryVariants.variantsFor(query) ?? r.variants,
                variantsLoading: queryVariants.loadingFor(query),
                brand: isBrandKeyword(query),
                to: `/pro/dashboard/sites/${linkSiteId.value}/search-console/queries/${encodeURIComponent(query)}`,
                onVariantOpen: () => queryVariants.open(query),
              }, () => newBadge(r)),
            ]),
          ]),
          h(ProSparklineCell, {
            data: sparklines.map.value.get(query) ?? null,
            pending: sparklines.pendingFor(query),
            error: !!sparklines.error.value,
            dates: sparklines.dates.value,
            label: query,
            period,
            metricLabel: sparkMetric.value === 'clicks' ? 'Clicks' : 'Impressions',
            partial: !gscFilters.stableData.value,
            width: 96,
            height: 20,
          }),
        ])
      },
    },
    { ...clicksColumn({ noInlineTrend: true }) },
    { ...clicksChangeColumn() },
    { ...impressionsColumn() },
    { ...ctrColumn() },
    { ...positionColumn() },
    {
      accessorKey: 'page',
      header: 'Top page',
      tooltip: 'The page on your site that ranks highest for this query',
      visibleFrom: 'xl',
      enableSorting: false,
      cell: ({ row }: CellContext<UiTableFeatures, KeywordTableRow, unknown>) => {
        if (!gscdumpSiteId)
          return dash()
        const key = rowQuery(row.original)
        return h(ProTopPageCell, {
          siteId,
          page: topPages.map.value.get(key) ?? null,
          pending: topPages.pendingFor(key),
        })
      },
    },
  ]
  return allCols.filter((col) => {
    const key = getProGscColumnKey(col)
    return !key || !(excludeColumns || []).includes(key)
  })
})
</script>

<template>
  <ProGscTableShell
    :filters="filters"
    dimension="queryCanonical"
    search-placeholder="Search queries..."
    empty-icon="i-lucide-search-code"
    empty-title="No queries found"
    empty-default-description="Query data will appear once Google Search Console syncs"
    item-label="queries"
    table-label="Search queries"
    :sort="sort"
    :sortable="sortable"
    :searchable="searchable"
    :page-size="pageSize"
    :q="q"
    :filter="filter"
    :is-loading="isLoading"
    :error="error"
    :rows="tableData"
    :total="total"
    :page="page"
    :columns="columns"
    :table-data="tableData"
    :load-more="loadMore"
    :has-more="hasMore"
    :is-loading-more="isLoadingMore"
    :loaded-count="loadedCount"
    :has-prev-data="data?.hasPrevData"
    :warnings="data?.warnings"
    @update:q="q = $event"
    @update:page="page = $event"
    @toggle-filter="toggleFilter($event)"
    @load-more="onLoadMore"
    @retry="refresh"
    @sort-column="toggleSort"
  />
</template>

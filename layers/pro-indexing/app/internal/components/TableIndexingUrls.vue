<script lang="ts" setup>
import type { UiTableColumn } from '#layers/design-system/app/shared/table'
import type { GscdumpIndexingUrl } from '#layers/pro-gsc/shared/gscdump-api'
import { h } from 'vue'
import UiStatusBadge from '#layers/design-system/app/components/element/UiStatusBadge.vue'
import UiUrlLabel from '#layers/design-system/app/components/element/UiUrlLabel.vue'
import ProGscTableShell from '#layers/pro-gsc/app/components/pro/ProGscTableShell.vue'
import { useProGscdumpIndexingUrls } from '#layers/pro-gsc/app/composables/useProGscdump'

/**
 * The URL evidence browser. One row per URL Google has inspected, with the
 * verdict, the coverage state and the crawl date it came from.
 *
 * Canonicals used to be a page of their own. It is a facet here instead
 * (`?facet=canonical_mismatch`): a canonical conflict is one reason a URL is
 * not indexed, so it belongs beside the other reasons rather than in a route
 * that only ever showed a slice of this table.
 *
 * `issue`, `status`, `facet`, `search` and `page` all live in the route query,
 * so any view of this table is a link someone can send.
 */

type StatusKey = 'indexed' | 'not_indexed' | 'pending'
type FacetKey = 'canonical_mismatch' | 'rich_results'

const {
  gscdumpSiteId,
  pageSize = 25,
  initialIssue,
  initialSearch,
  initialFacet,
  initialStatus,
} = defineProps<{
  gscdumpSiteId: string | null | undefined
  pageSize?: number
  initialIssue?: string
  initialSearch?: string
  /** `canonical_mismatch` or `rich_results`, from `?facet=`. */
  initialFacet?: FacetKey
  /** Shareable status filter. An issue filter wins when both are supplied. */
  initialStatus?: StatusKey
}>()

const route = useRoute()
const router = useRouter()

const facet = computed(() => initialFacet)
const isCanonicalFacet = computed(() => facet.value === 'canonical_mismatch')
const isRichResultsFacet = computed(() => facet.value === 'rich_results')

const search = ref(initialSearch ?? '')
const status = ref<StatusKey | undefined>(initialStatus)
const issue = computed(() => initialIssue)
// `issueDetails` carries the description and the fix, never a display label,
// so the type is title-cased for the chip.
function humaniseIssue(type: string): string {
  const words = type.replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
const issueLabel = computed(() => (issue.value ? humaniseIssue(issue.value) : null))

/**
 * A facet reads the whole inspected set and narrows it here, because the v1
 * URL list has no facet parameter. Without the wider window a canonical view
 * would show only the conflicts that happened to land in the first page.
 */
const requestLimit = computed(() => (facet.value ? 500 : pageSize))

const loaded = ref(pageSize)
const params = computed(() => ({
  limit: requestLimit.value,
  offset: 0,
  status: status.value,
  issue: issue.value,
  search: search.value || undefined,
}))

const { data, status: fetchStatus, error, refresh } = useProGscdumpIndexingUrls(
  computed(() => gscdumpSiteId ?? ''),
  params,
)

function matchesFacet(row: GscdumpIndexingUrl): boolean {
  if (isCanonicalFacet.value)
    return row.canonicalMismatchKind !== 'none'
  if (isRichResultsFacet.value)
    return Boolean(row.richResultsVerdict)
  return true
}

const allRows = computed(() => (data.value?.urls ?? []).filter(matchesFacet))
const rows = computed(() => (facet.value ? allRows.value.slice(0, loaded.value) : allRows.value))
const total = computed(() => (facet.value ? allRows.value.length : data.value?.pagination.total ?? 0))
const hasMore = computed(() => (facet.value
  ? loaded.value < allRows.value.length
  : Boolean(data.value?.pagination.hasMore)))

// Without a facet the server pages for us, so "load more" widens the window.
const serverWindow = ref(pageSize)
watch([status, search, issue, facet], () => {
  loaded.value = pageSize
  serverWindow.value = pageSize
})

const statusFilters = [
  { key: 'indexed', label: 'Indexed', icon: 'i-lucide-circle-check', tooltip: 'URLs Google currently reports as indexed' },
  { key: 'not_indexed', label: 'Not indexed', icon: 'i-lucide-circle-x', tooltip: 'URLs Google has inspected and not indexed' },
  { key: 'pending', label: 'Pending', icon: 'i-lucide-clock-3', tooltip: 'URLs waiting for an inspection result' },
]

function setQuery(updates: Record<string, string | undefined>) {
  const query = { ...route.query }
  for (const [key, value] of Object.entries(updates)) {
    if (value)
      query[key] = value
    else
      delete query[key]
  }
  void router.replace({ query })
}

function toggleFilter(key: string) {
  const next = key === status.value ? undefined : key as StatusKey
  status.value = next
  setQuery({ status: next })
}

function clearFilters() {
  status.value = undefined
  search.value = ''
  setQuery({ status: undefined, search: undefined, issue: undefined, facet: undefined })
}

watch(search, (value) => {
  setQuery({ search: value || undefined })
})

function loadMore() {
  if (facet.value) {
    loaded.value += pageSize
    return
  }
  serverWindow.value += pageSize
  loaded.value += pageSize
}

// Server-paged mode accumulates by widening the request window, which keeps
// the shell's "showing X of Y" line honest without stitching pages by hand.
watch(serverWindow, (value) => {
  if (!facet.value && value > requestLimit.value)
    void refresh()
})

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

function formatDate(value: string | null | undefined): string {
  if (!value)
    return 'Never'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown' : dateFormatter.format(date)
}

function verdictStatus(verdict: GscdumpIndexingUrl['verdict']) {
  if (verdict === 'PASS')
    return 'success' as const
  if (verdict === 'FAIL')
    return 'error' as const
  if (verdict === 'PARTIAL')
    return 'warning' as const
  return 'neutral' as const
}

const CANONICAL_KIND_LABELS: Record<string, string> = {
  formatting: 'Formatting only',
  path: 'Different path',
  cross_domain: 'Different domain',
}

function headerCell(label: string) {
  return () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, label)
}

const columns = computed<UiTableColumn<GscdumpIndexingUrl>[]>(() => [
  {
    accessorKey: 'url',
    header: headerCell('URL'),
    cell: ({ row }) => h(UiUrlLabel, { url: row.original.url, class: 'max-w-md' }),
  },
  {
    accessorKey: 'verdict',
    header: headerCell('Verdict'),
    cell: ({ row }) => h(UiStatusBadge, {
      status: verdictStatus(row.original.verdict),
      label: row.original.verdict ?? 'Unknown',
      size: 'sm',
    }),
  },
  ...(isCanonicalFacet.value
    ? [
        {
          accessorKey: 'userCanonical',
          header: headerCell('Your canonical'),
          cell: ({ row }) => h('span', { class: 'block max-w-xs truncate text-sm text-muted', title: row.original.userCanonical ?? '' }, row.original.userCanonical || 'None declared'),
        } satisfies UiTableColumn<GscdumpIndexingUrl>,
        {
          accessorKey: 'googleCanonical',
          header: headerCell('Google picked'),
          cell: ({ row }) => h('span', { class: 'block max-w-xs truncate text-sm text-default', title: row.original.googleCanonical ?? '' }, row.original.googleCanonical || 'Not reported'),
        } satisfies UiTableColumn<GscdumpIndexingUrl>,
        {
          accessorKey: 'canonicalMismatchKind',
          header: headerCell('Difference'),
          cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, CANONICAL_KIND_LABELS[row.original.canonicalMismatchKind] ?? 'None'),
        } satisfies UiTableColumn<GscdumpIndexingUrl>,
      ]
    : []),
  ...(isRichResultsFacet.value
    ? [
        {
          accessorKey: 'richResultsVerdict',
          header: headerCell('Rich results'),
          cell: ({ row }) => h(UiStatusBadge, {
            status: verdictStatus(row.original.richResultsVerdict ?? null),
            label: row.original.richResultsVerdict ?? 'Unknown',
            size: 'sm',
          }),
        } satisfies UiTableColumn<GscdumpIndexingUrl>,
      ]
    : []),
  {
    accessorKey: 'coverageState',
    header: headerCell('Coverage'),
    cell: ({ row }) => h('span', { class: 'text-sm text-muted' }, row.original.coverageState || 'Unknown'),
  },
  {
    accessorKey: 'lastCrawlTime',
    header: headerCell('Last crawl'),
    align: 'right',
    cell: ({ row }) => h('span', { class: 'text-sm tabular-nums text-muted' }, formatDate(row.original.lastCrawlTime)),
  },
])

const tableData = computed(() => rows.value.map((row, index) => ({
  ...row,
  id: row.url || String(index),
})))

const facetTitle = computed(() => {
  if (isCanonicalFacet.value)
    return 'URLs where Google picked a different canonical'
  if (isRichResultsFacet.value)
    return 'URLs with rich result evidence'
  return 'Indexing URLs'
})

const emptyDescription = computed(() => {
  if (isCanonicalFacet.value)
    return 'Google agrees with every canonical it has inspected on this site.'
  if (isRichResultsFacet.value)
    return 'No inspected URL carries a rich result verdict yet.'
  return 'URL inspection results appear once the first indexing sync finishes.'
})
</script>

<template>
  <ProPageZone tier="primary" first>
    <ProSectionHeader
      :title="facetTitle"
      icon="i-lucide-link-2"
      :badge="total"
      tooltip="Inspection results and coverage details for each URL Google has seen."
    />

    <div v-if="issueLabel" class="mb-3 flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted">Filtered to</span>
      <UiChip :label="issueLabel" />
      <UiButton purpose="link" size="xs" class="min-h-11 sm:min-h-0" @click="setQuery({ issue: undefined })">
        Clear issue filter
      </UiButton>
    </div>

    <ProGscTableShell
      :filters="statusFilters"
      search-placeholder="Search URLs..."
      empty-icon="i-lucide-link-2"
      empty-title="No URLs found"
      :empty-default-description="emptyDescription"
      item-label="URLs"
      :page-size="pageSize"
      load-more
      :has-more="hasMore"
      :loaded-count="rows.length"
      :has-external-filter="Boolean(issue || facet)"
      :q="search"
      :filter="status"
      :is-loading="fetchStatus === 'pending'"
      :is-loading-more="fetchStatus === 'pending' && rows.length > 0"
      :error="error"
      :rows="rows"
      :total="total"
      :page="1"
      :columns="columns"
      :table-data="tableData"
      @update:q="search = $event"
      @toggle-filter="toggleFilter"
      @clear-filters="clearFilters"
      @load-more="loadMore"
      @retry="refresh"
    />
  </ProPageZone>
</template>

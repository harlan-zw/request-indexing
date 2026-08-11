<script lang="ts" setup>
import type { GscdumpIndexingUrl } from '#layers/pro-gsc/shared/gscdump-api'
import { h } from 'vue'
import { ProStatusBadge } from '#components'
import ProGscTableShell from '#layers/pro-gsc/app/components/pro/ProGscTableShell.vue'
import { useProGscdumpIndexingUrls } from '#layers/pro-gsc/app/composables/useProGscdump'

definePageMeta({ proTab: { feature: 'indexing', label: 'URLs', icon: 'i-lucide-link-2', order: 30 } })

type IndexingStatus = 'indexed' | 'not_indexed' | 'pending'

const { gscdumpSiteId } = useSite()
const route = useRoute()

function parseStatus(value: unknown): IndexingStatus | 'default' {
  return value === 'indexed' || value === 'not_indexed' || value === 'pending' ? value : 'default'
}

const pageSize = 25
const page = ref(1)
const q = ref(typeof route.query.search === 'string' ? route.query.search : '')
const filter = ref<IndexingStatus | 'default'>(parseStatus(route.query.status))
const issue = typeof route.query.issue === 'string' ? route.query.issue : undefined

const params = computed(() => ({
  limit: pageSize,
  offset: (page.value - 1) * pageSize,
  status: filter.value === 'default' ? undefined : filter.value,
  issue,
  search: q.value || undefined,
}))

const { data, status, error, refresh } = useProGscdumpIndexingUrls(
  computed(() => gscdumpSiteId.value ?? ''),
  params,
)

const rows = computed(() => data.value?.urls ?? [])
const total = computed(() => data.value?.pagination.total ?? 0)

const filters = [
  { key: 'indexed', label: 'Indexed', icon: 'i-lucide-circle-check', tooltip: 'URLs currently indexed by Google' },
  { key: 'not_indexed', label: 'Not indexed', icon: 'i-lucide-circle-x', tooltip: 'URLs Google has not indexed' },
  { key: 'pending', label: 'Pending', icon: 'i-lucide-clock-3', tooltip: 'URLs waiting for an inspection result' },
]

function setPage(value: number) {
  page.value = value
}

function toggleFilter(value: string) {
  const next = parseStatus(value)
  filter.value = filter.value === next ? 'default' : next
  page.value = 1
}

watch(q, () => {
  page.value = 1
})

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

function formatDate(value: string | null | undefined) {
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

const columns = [
  {
    accessorKey: 'url',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'URL'),
    cell: ({ row }: any) => h('a', {
      href: row.original.url,
      target: '_blank',
      rel: 'noopener',
      title: row.original.url,
      class: 'block max-w-md truncate text-sm hover:text-primary transition-colors',
    }, row.original.url),
  },
  {
    accessorKey: 'verdict',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'Verdict'),
    cell: ({ row }: any) => h(ProStatusBadge, {
      status: verdictStatus(row.original.verdict),
      label: row.original.verdict,
      size: 'sm',
    }),
  },
  {
    accessorKey: 'coverageState',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'Coverage'),
    cell: ({ row }: any) => h('span', { class: 'text-sm text-muted' }, row.original.coverageState || 'Unknown'),
  },
  {
    accessorKey: 'lastCrawlTime',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'Last crawl'),
    meta: { align: 'right' as const },
    cell: ({ row }: any) => h('span', { class: 'text-sm tabular-nums text-muted' }, formatDate(row.original.lastCrawlTime)),
  },
]

const tableData = computed(() => rows.value.map((row, index) => ({
  ...row,
  id: row.url || String(index),
})))
</script>

<template>
  <ProPageStates>
    <ProPageZone tier="primary" first>
      <ProSectionHeader
        title="Indexing URLs"
        icon="i-lucide-link-2"
        :badge="total"
        tooltip="Inspection results and coverage details for each URL Google has seen."
      />
      <ProGscTableShell
        :filters="filters"
        search-placeholder="Search URLs..."
        empty-icon="i-lucide-link-2"
        empty-title="No URLs found"
        empty-default-description="URL inspection data will appear after indexing sync completes."
        item-label="URLs"
        :page-size="pageSize"
        :q="q"
        :filter="filter"
        :is-loading="status === 'pending'"
        :error="error"
        :rows="rows"
        :total="total"
        :page="page"
        :columns="columns"
        :table-data="tableData"
        @update:q="q = $event"
        @update:page="setPage"
        @toggle-filter="toggleFilter"
        @retry="refresh"
      />
    </ProPageZone>
  </ProPageStates>
</template>

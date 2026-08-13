<script lang="ts" setup>
import type { UiTableColumn, UiTableRow } from '~~/layers/design-system/components/data/table-features'
import type { GscdumpDataRow } from '#layers/pro-gsc/app/composables/useProGscdump'
import { h } from 'vue'
import { UIcon } from '#components'
import countries from '#layers/core/shared/shared/data/countries'
import ProGscTableShell from '#layers/pro-gsc/app/components/pro/ProGscTableShell.vue'
import { useProGscdumpTableData } from '#layers/pro-gsc/app/composables/useProGscdump'

definePageMeta({ proTab: { feature: 'search-console', label: 'Countries', icon: 'i-lucide-globe', order: 30 } })

const { siteStatus, gscdumpSiteId } = useSite('Countries')
const { period, stableData } = useSitePeriod()

const countryByAlpha3 = new Map(countries.map(country => [country['alpha-3'], country]))

function countryDetails(code: string | null | undefined) {
  const normalized = code?.toUpperCase() || ''
  const country = countryByAlpha3.get(normalized)
  return {
    flag: country ? `i-circle-flags-${country['alpha-2'].toLowerCase()}` : 'i-lucide-globe-2',
    name: country?.name || normalized || 'Unknown',
  }
}

function formatMetric(value: number | null | undefined, decimals = 0) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value ?? 0)
}

const {
  q,
  page,
  rows,
  total,
  isLoading,
  error,
  setPage,
  refresh,
} = useProGscdumpTableData<GscdumpDataRow>({
  siteId: computed(() => gscdumpSiteId.value ?? undefined),
  dimension: 'country',
  period,
  stableData,
  pageSize: 25,
  defaultSort: { column: 'clicks', direction: 'desc' },
})

const columns: UiTableColumn<GscdumpDataRow>[] = [
  {
    accessorKey: 'country',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'Country'),
    cell: ({ row }: { row: UiTableRow<GscdumpDataRow> }) => {
      const details = countryDetails(row.original.country)
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UIcon, { name: details.flag, class: 'size-4 shrink-0' }),
        h('span', { class: 'text-sm text-default' }, details.name),
      ])
    },
  },
  {
    accessorKey: 'clicks',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'Clicks'),
    meta: { align: 'right' as const },
    cell: ({ row }: { row: UiTableRow<GscdumpDataRow> }) => h('span', { class: 'text-sm tabular-nums' }, formatMetric(row.original.clicks)),
  },
  {
    accessorKey: 'impressions',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'Impressions'),
    meta: { align: 'right' as const },
    cell: ({ row }: { row: UiTableRow<GscdumpDataRow> }) => h('span', { class: 'text-sm tabular-nums' }, formatMetric(row.original.impressions)),
  },
  {
    accessorKey: 'ctr',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'CTR'),
    meta: { align: 'right' as const },
    cell: ({ row }: { row: UiTableRow<GscdumpDataRow> }) => h('span', { class: 'text-sm tabular-nums' }, `${formatMetric((row.original.ctr ?? 0) * 100, 1)}%`),
  },
  {
    accessorKey: 'position',
    header: () => h('span', { class: 'text-[11px] font-semibold uppercase tracking-[0.1em] text-muted' }, 'Position'),
    meta: { align: 'right' as const },
    cell: ({ row }: { row: UiTableRow<GscdumpDataRow> }) => h('span', { class: 'text-sm tabular-nums' }, formatMetric(row.original.position, 1)),
  },
]

const tableData = computed(() => rows.value.map((row, index) => ({
  ...row,
  id: row.country || String(index),
})))
</script>

<template>
  <Alert
    v-if="siteStatus === 'error'"
    color="error"
    title="Failed to load site data."
  >
    <template #action>
      <UButton size="xs" color="neutral" variant="subtle" to="/pro/dashboard">
        Back to Sites
      </UButton>
    </template>
  </Alert>

  <ProPageZone v-else tier="primary" first>
    <ProSectionHeader
      title="Countries"
      icon="i-lucide-globe"
      tooltip="Where your search traffic comes from, based on the searcher's location."
    />
    <ProGscTableShell
      search-placeholder="Search countries..."
      empty-icon="i-lucide-globe-2"
      empty-title="No country data"
      empty-default-description="Country data will appear after Search Console finishes syncing."
      item-label="countries"
      :page-size="25"
      :q="q"
      :filter="undefined"
      :is-loading="isLoading"
      :error="error"
      :rows="rows"
      :total="total"
      :page="page"
      :columns="columns"
      :table-data="tableData"
      @update:q="q = $event"
      @update:page="setPage"
      @retry="refresh"
    />
  </ProPageZone>
</template>

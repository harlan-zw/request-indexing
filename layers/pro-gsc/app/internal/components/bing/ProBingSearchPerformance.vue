<script setup lang="ts">
// Bing Search Performance: one year of daily traffic, plus the Pages and
// Keywords breakdowns Bing refreshes weekly.
//
// Ported from nuxtseo.com `app/internal/components/bing/ProBingSearchPerformance.vue`.
// The breakdown table reads the same `partner.sites.bing.data.get` operation as
// the chart, one dataset at a time, so switching Pages/Keywords is a new page
// of the same read rather than a second endpoint.
import type { BingDataV1 } from '@gscdump/contracts/v1/http'
import type { BingReportingWindow } from '#layers/pro-gsc/shared/bing-reporting-window'
import {
  UiAlert,
  UiDataTableSection,
  UiEmptyState,
  UiLineChart,
  UiMetricStat,
  UiMetricToggle,
  UiRelativeTime,
  UiSectionHeader,
  UiTableMetricCell,
  UiTablePathCell,
  UiTableShell,
  UiTableTd,
  UiTableTh,
  UiTogglePill,
} from '#components'
import { useProGscdumpBingData } from '#layers/pro-gsc/app/composables/useProGscdump'
import {
  bingTrafficTotals,
  formatBingCtr,
  formatBingNumber,
  formatBingReportingDay,
} from '#layers/pro-gsc/app/utils/bing-view'

const { data, siteId, window } = defineProps<{
  data: Extract<BingDataV1, { dataset: 'traffic' }>
  siteId: string
  window: BingReportingWindow
}>()

const metrics = ref(['clicks', 'impressions'])
const metricOptions = [
  { key: 'clicks', label: 'Clicks', color: 'blue' },
  { key: 'impressions', label: 'Impressions', color: 'blue' },
]
const chartSeries = computed(() => metricOptions
  .filter(option => metrics.value.includes(option.key))
  .map(option => ({ key: option.key, label: option.label })))
const totals = computed(() => bingTrafficTotals(data.rows))
const lastCollection = computed(() => data.sync._tag === 'missing' ? null : data.sync.observedAt)

type EntityKind = 'pages' | 'keywords'
interface EntityRow extends Record<string, unknown> {
  key: string
  label: string
  date: string
  url: string | null
  clicks: number
  impressions: number
  averagePosition: number | null
}

const entityKind = ref<EntityKind>('pages')
const entityOptions = [
  { label: 'Pages', value: 'pages' as const },
  { label: 'Keywords', value: 'keywords' as const },
]
const page = ref(1)
const PAGE_SIZE = 10

const entityQuery = useProGscdumpBingData(() => siteId, {
  dataset: () => entityKind.value,
  window: () => window,
  limit: PAGE_SIZE,
  offset: () => (page.value - 1) * PAGE_SIZE,
})

// A delayed collection keeps the last successful rows on screen, so the notice
// has to name the delay rather than let a stale chart read as current.
const unavailable = computed(() =>
  data.sync._tag === 'unavailable' || entityQuery.data.value?.sync._tag === 'unavailable')

const visibleRows = computed<EntityRow[]>(() => {
  const result = entityQuery.data.value
  if (!result || result.dataset !== entityKind.value)
    return []
  if (result.dataset === 'pages') {
    return result.rows.map(row => ({
      key: `${row.date}:${row.page}`,
      date: row.date,
      label: row.page,
      url: row.page,
      clicks: row.clicks,
      impressions: row.impressions,
      averagePosition: row.averageImpressionPosition,
    }))
  }
  if (result.dataset === 'keywords') {
    return result.rows.map(row => ({
      key: `${row.date}:${row.keyword}`,
      date: row.date,
      label: row.keyword,
      url: null,
      clicks: row.clicks,
      impressions: row.impressions,
      averagePosition: row.averageImpressionPosition,
    }))
  }
  return []
})
const totalRows = computed(() => entityQuery.data.value?.pagination.total ?? 0)

watch(entityKind, () => {
  page.value = 1
})
watch(() => entityQuery.data.value, (result) => {
  if (result && result.dataset === entityKind.value)
    page.value = Math.min(page.value, Math.max(1, Math.ceil(result.pagination.total / PAGE_SIZE)))
})

function rowCtr(row: EntityRow): string {
  return formatBingCtr(row.impressions === 0 ? 0 : row.clicks / row.impressions)
}
</script>

<template>
  <div class="flex flex-col gap-6" data-testid="bing-search-performance">
    <UiAlert
      v-if="unavailable"
      status="warning"
      title="Some Bing data is delayed"
      description="The last successful collection stays visible while the next daily sync retries."
    />

    <p class="text-xs text-muted">
      {{ window.startDate }} to {{ window.endDate }}<template v-if="lastCollection">
        . Collected <UiRelativeTime :date="lastCollection" />
      </template>
    </p>

    <UiEmptyState
      v-if="!data.rows.length"
      icon="search"
      title="No Bing traffic in this date range"
      description="Pages and Keywords can still have data below."
      :animated="false"
    />

    <div v-if="data.rows.length" class="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-default bg-elevated/30 px-4 py-3">
      <UiMetricStat :value="formatBingNumber(totals.clicks)" label="clicks" />
      <UiMetricStat :value="formatBingNumber(totals.impressions)" label="impressions" />
      <UiMetricStat :value="formatBingCtr(totals.ctr)" label="CTR" />
    </div>

    <div v-if="data.rows.length" class="rounded-xl border border-default bg-default p-4">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold text-highlighted">
          Traffic over time
        </h3>
        <UiMetricToggle v-model="metrics" :options="metricOptions" icon-only />
      </div>
      <UiLineChart
        :data="data.rows"
        x-key="date"
        :series="chartSeries"
        :height="220"
        :x-format="value => formatBingReportingDay(String(value))"
        :y-format="value => formatBingNumber(value)"
      />
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <UiSectionHeader
        :title="entityKind === 'pages' ? 'Top Pages' : 'Top Keywords'"
        tooltip="Bing updates its top Pages and Keywords weekly."
      />
      <UiTogglePill v-model="entityKind" :options="entityOptions" label="Bing breakdown" />
    </div>

    <UiDataTableSection
      v-model:page="page"
      :rows="visibleRows"
      :total="totalRows"
      :pending="entityQuery.status.value === 'pending'"
      :error="entityQuery.error.value ? 'Bing data could not be loaded. Retry the request.' : undefined"
      :searchable="false"
      :columns="[]"
      :page-size="PAGE_SIZE"
      manual-pagination
      empty-icon="search"
      :empty-title="entityKind === 'pages' ? 'No Bing Pages yet' : 'No Bing Keywords yet'"
      empty-description="Bing refreshes this breakdown weekly."
      item-label="rows"
      :label="entityKind === 'pages' ? 'Top Bing Pages' : 'Top Bing Keywords'"
      @retry="entityQuery.refresh"
    >
      <template #body>
        <UiTableShell
          bordered
          row-hover
          size="xs"
          :label="entityKind === 'pages' ? 'Top Bing Pages' : 'Top Bing Keywords'"
        >
          <template #head>
            <UiTableTh>
              {{ entityKind === 'pages' ? 'Page' : 'Keyword' }}
            </UiTableTh>
            <UiTableTh visible-from="md">
              Date
            </UiTableTh>
            <UiTableTh numeric>
              Clicks
            </UiTableTh>
            <UiTableTh numeric>
              Impressions
            </UiTableTh>
            <UiTableTh numeric visible-from="md">
              CTR
            </UiTableTh>
            <UiTableTh numeric visible-from="lg">
              Avg position
            </UiTableTh>
          </template>
          <tr v-for="row in visibleRows" :key="row.key">
            <UiTableTd row-header class="max-w-0 w-full">
              <UiTablePathCell v-if="row.url" :url="row.url" />
              <span v-else class="block truncate text-xs text-default" :title="row.label">{{ row.label }}</span>
            </UiTableTd>
            <UiTableTd visible-from="md" class="whitespace-nowrap text-muted">
              {{ row.date }}
            </UiTableTd>
            <UiTableTd numeric>
              <UiTableMetricCell :value="row.clicks" :display="formatBingNumber(row.clicks)" />
            </UiTableTd>
            <UiTableTd numeric>
              <UiTableMetricCell :value="row.impressions" :display="formatBingNumber(row.impressions)" muted />
            </UiTableTd>
            <UiTableTd numeric visible-from="md">
              <UiTableMetricCell :value="row.impressions ? row.clicks / row.impressions : 0" :display="rowCtr(row)" muted />
            </UiTableTd>
            <UiTableTd numeric visible-from="lg">
              <UiTableMetricCell
                :value="row.averagePosition"
                :display="row.averagePosition == null ? null : row.averagePosition.toFixed(1)"
                muted
              />
            </UiTableTd>
          </tr>
        </UiTableShell>
      </template>
    </UiDataTableSection>
  </div>
</template>

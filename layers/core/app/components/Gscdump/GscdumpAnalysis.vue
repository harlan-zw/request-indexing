<script lang="ts" setup>
import type { TableColumn } from '@nuxt/ui'
import type { AnalysisPreset, GscdumpAnalysisParams, GscdumpAnalysisResult } from '~~/layers/core/app/composables/useGscdump'

const props = defineProps<{
  siteId: string
  preset: AnalysisPreset
  brandTerms?: string
}>()

const { period: dashboardPeriod } = useDashboardPeriod()

const search = ref('')
const page = ref(1)
const pageSize = 20

const params = computed<GscdumpAnalysisParams>(() => {
  const days = periodToDays(dashboardPeriod.value)
  return {
    preset: props.preset,
    startDate: daysAgo(days),
    endDate: daysAgo(1),
    prevStartDate: daysAgo(days * 2),
    prevEndDate: daysAgo(days + 1),
    brandTerms: props.brandTerms || undefined,
    limit: pageSize,
    offset: (page.value - 1) * pageSize,
    search: search.value || undefined,
  }
})

const { data, status, error, refresh } = useGscdumpAnalysis(
  () => props.siteId,
  params,
)

const keywords = computed(() => data.value?.keywords ?? [])

const emptyMessage = computed(() => search.value
  ? `No keywords match your search for "${search.value}".`
  : 'No keywords match this view for the selected period.')

watch(() => props.preset, () => {
  page.value = 1
})
watch(search, () => {
  page.value = 1
})

interface AnalysisColumn {
  key: keyof GscdumpAnalysisResult
  label: string
}

const presetColumns: Record<string, AnalysisColumn[]> = {
  'striking-distance': [
    { key: 'keyword', label: 'Keyword' },
    { key: 'position', label: 'Position' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'ctr', label: 'CTR' },
    { key: 'potentialClicks', label: 'Potential' },
  ],
  'opportunity': [
    { key: 'keyword', label: 'Keyword' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'ctr', label: 'CTR' },
    { key: 'position', label: 'Position' },
    { key: 'opportunityScore', label: 'Score' },
    { key: 'potentialClicks', label: 'Potential' },
  ],
  'movers-rising': [
    { key: 'keyword', label: 'Keyword' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'clicksChange', label: 'Change' },
    { key: 'clicksChangePercent', label: 'Change %' },
    { key: 'position', label: 'Position' },
    { key: 'positionChange', label: 'Pos Change' },
  ],
  'movers-declining': [
    { key: 'keyword', label: 'Keyword' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'clicksChange', label: 'Change' },
    { key: 'clicksChangePercent', label: 'Change %' },
    { key: 'position', label: 'Position' },
    { key: 'positionChange', label: 'Pos Change' },
  ],
  'decay': [
    { key: 'keyword', label: 'Keyword' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'prevClicks', label: 'Prev Clicks' },
    { key: 'decayPercent', label: 'Decay %' },
    { key: 'position', label: 'Position' },
    { key: 'impressions', label: 'Impressions' },
  ],
  'zero-click': [
    { key: 'keyword', label: 'Keyword' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'ctr', label: 'CTR' },
    { key: 'position', label: 'Position' },
    { key: 'missedClicks', label: 'Missed Clicks' },
  ],
  'non-brand': [
    { key: 'keyword', label: 'Keyword' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'position', label: 'Position' },
    { key: 'ctr', label: 'CTR' },
  ],
  'brand-only': [
    { key: 'keyword', label: 'Keyword' },
    { key: 'clicks', label: 'Clicks' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'position', label: 'Position' },
    { key: 'ctr', label: 'CTR' },
  ],
}

const columns = computed(() => presetColumns[props.preset] || presetColumns['non-brand'])
const tableColumns = computed<TableColumn<GscdumpAnalysisResult>[]>(() => (columns.value ?? []).map(column => ({
  accessorKey: column.key,
  header: column.label,
})))

function formatCell(row: GscdumpAnalysisResult, key: keyof GscdumpAnalysisResult) {
  const v = row[key]
  if (v == null)
    return '-'
  if (key === 'ctr' && typeof v === 'number')
    return `${useHumanFriendlyNumber(v * 100, 1)}%`
  if ((key === 'clicksChangePercent' || key === 'decayPercent') && typeof v === 'number')
    return `${useHumanFriendlyNumber(v, 1)}%`
  if (key === 'position' && typeof v === 'number')
    return useHumanFriendlyNumber(v, 1)
  if (Array.isArray(v))
    return v.join(', ')
  return typeof v === 'number' ? useHumanFriendlyNumber(v) : v
}
</script>

<template>
  <div>
    <div v-if="data?.summary" class="grid grid-cols-4 gap-4 mb-6">
      <UCard v-if="data.summary.brandClicks != null" :ui="{ body: 'sm:px-3 sm:py-2' }">
        <div class="text-xs text-gray-500">
          Brand Clicks
        </div>
        <div class="text-xl font-mono">
          {{ useHumanFriendlyNumber(data.summary.brandClicks) }}
        </div>
      </UCard>
      <UCard v-if="data.summary.nonBrandClicks != null" :ui="{ body: 'sm:px-3 sm:py-2' }">
        <div class="text-xs text-gray-500">
          Non-Brand Clicks
        </div>
        <div class="text-xl font-mono">
          {{ useHumanFriendlyNumber(data.summary.nonBrandClicks) }}
        </div>
      </UCard>
      <UCard v-if="data.summary.brandShare != null" :ui="{ body: 'sm:px-3 sm:py-2' }">
        <div class="text-xs text-gray-500">
          Brand Share
        </div>
        <div class="text-xl font-mono">
          {{ useHumanFriendlyNumber(data.summary.brandShare * 100, 1) }}%
        </div>
      </UCard>
    </div>

    <div class="flex items-center gap-5 mb-3">
      <div class="flex w-[200px]">
        <UInput
          v-model="search"
          class="w-full"
          placeholder="Search keywords..."
          icon="i-heroicons-magnifying-glass"
          autocomplete="off"
          size="xs"
        >
          <template #trailing>
            <UButton
              v-show="search"
              color="neutral"
              variant="link"
              icon="i-heroicons-x-mark"
              :padded="false"
              @click="search = ''"
            />
          </template>
        </UInput>
      </div>
      <div v-if="data?.meta?.presetDescription" class="text-xs text-gray-500">
        {{ data.meta.presetDescription }}
      </div>
    </div>

    <AsyncCardState
      :status="status"
      :error="error"
      :empty="!keywords.length"
      label="keyword analysis"
      :empty-message="emptyMessage"
      min-height="min-h-40"
      :rows="5"
      @retry="refresh()"
    >
      <UTable
        :data="keywords"
        :columns="tableColumns"
        :ui="{
          th: 'px-2 py-2 text-xs font-normal',
          td: 'px-2 py-1',
        }"
      >
        <template #keyword-cell="{ row }">
          <UiTooltip :text="row.original.keyword" size="lg">
            <span class="block max-w-[280px] truncate text-xs text-default">{{ row.original.keyword }}</span>
          </UiTooltip>
        </template>
        <template v-for="col in columns?.filter(c => c.key !== 'keyword')" :key="col.key" #[`${String(col.key)}-cell`]="{ row }">
          <div class="text-right font-mono text-xs tabular-nums">
            {{ formatCell(row.original, col.key) }}
          </div>
        </template>
      </UTable>

      <!-- The pagination was still on the Nuxt UI v2 API (`v-model`,
           `page-count`, `max`, `*-button`), so none of it bound and the table
           was stuck on page one with no row count. -->
      <div v-if="data && data.totalCount > pageSize" class="flex flex-wrap items-center justify-between gap-3 pt-3">
        <UPagination
          v-model:page="page"
          :items-per-page="pageSize"
          :total="data.totalCount"
          :sibling-count="2"
          :show-edges="false"
          size="xs"
          variant="link"
        />
        <p class="text-xs text-muted tabular-nums">
          {{ useHumanFriendlyNumber(data.totalCount) }} keywords
        </p>
      </div>
    </AsyncCardState>
  </div>
</template>

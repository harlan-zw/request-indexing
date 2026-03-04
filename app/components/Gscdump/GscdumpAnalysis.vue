<script lang="ts" setup>
import type { AnalysisPreset, GscdumpAnalysisParams, GscdumpAnalysisResult } from '~/composables/useGscdump'

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

const { data, status } = useGscdumpAnalysis(
  () => props.siteId,
  params,
)

watch(() => props.preset, () => { page.value = 1 })
watch(search, () => { page.value = 1 })

const presetColumns: Record<string, Array<{ key: string, label: string }>> = {
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

function formatCell(row: GscdumpAnalysisResult, key: string) {
  const v = (row as any)[key]
  if (v == null)
    return '-'
  if (key === 'ctr')
    return `${useHumanFriendlyNumber(v * 100, 1)}%`
  if (key === 'clicksChangePercent' || key === 'decayPercent')
    return `${useHumanFriendlyNumber(v, 1)}%`
  if (key === 'position')
    return useHumanFriendlyNumber(v, 1)
  return useHumanFriendlyNumber(v)
}
</script>

<template>
  <div>
    <div v-if="data?.summary" class="grid grid-cols-4 gap-4 mb-6">
      <UCard v-if="data.summary.brandClicks != null" :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
        <div class="text-xs text-gray-500">
          Brand Clicks
        </div>
        <div class="text-xl font-mono">
          {{ useHumanFriendlyNumber(data.summary.brandClicks) }}
        </div>
      </UCard>
      <UCard v-if="data.summary.nonBrandClicks != null" :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
        <div class="text-xs text-gray-500">
          Non-Brand Clicks
        </div>
        <div class="text-xl font-mono">
          {{ useHumanFriendlyNumber(data.summary.nonBrandClicks) }}
        </div>
      </UCard>
      <UCard v-if="data.summary.brandShare != null" :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
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

    <UTable
      :loading="status === 'pending'"
      :rows="data?.keywords || []"
      :columns="columns"
      :ui="{
        th: { padding: 'px-2 py-2', size: 'text-xs', font: 'font-normal' },
        td: { padding: 'px-2 py-1' },
      }"
    >
      <template #keyword-data="{ row }">
        <span class="text-xs text-blue-600">{{ row.keyword }}</span>
      </template>
      <template v-for="col in columns.filter(c => c.key !== 'keyword')" :key="col.key" #[`${col.key}-data`]="{ row }">
        <div class="text-right font-mono text-xs">
          {{ formatCell(row, col.key) }}
        </div>
      </template>
    </UTable>

    <div v-if="data && data.totalCount > pageSize" class="flex items-center gap-3 pt-3">
      <UPagination
        v-model="page"
        :inactive-button="{ variant: 'link' }"
        :active-button="{ color: 'blue', variant: 'link', class: 'underline' }"
        :prev-button="false"
        :next-button="{ variant: 'link' }"
        size="xs"
        :page-count="pageSize"
        :max="5"
        :total="data.totalCount"
      />
    </div>
  </div>
</template>

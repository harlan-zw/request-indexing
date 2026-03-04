<script lang="ts" setup>
const props = withDefaults(defineProps<{
  siteId: string
  period?: import('~/composables/useGscdump').Period
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
  pagination?: boolean
  excludeColumns?: string[]
  filter?: string
  extraFilters?: Array<{ type: string, column: string, value: string }>
}>(), {
  pageSize: 10,
  searchable: true,
  sortable: true,
  pagination: true,
})

const columns = [
  { key: 'page', label: 'Page', sortable: true },
  { key: 'clicks', label: 'Clicks', sortable: true, class: 'w-20 text-right' },
  { key: 'impressions', label: 'Views', sortable: true, class: 'w-20 text-right' },
  { key: 'position', label: 'Position', sortable: true, class: 'w-20 text-right' },
  { key: 'ctr', label: 'CTR', sortable: true, class: 'w-16 text-right' },
  { key: 'topKeyword', label: 'Top Keyword', class: 'w-32' },
]

function pageToPath(url: string) {
  try { return new URL(url).pathname }
  catch { return url }
}
</script>

<template>
  <GscdumpTable
    :site-id="siteId"
    dimension="page"
    :period="period"
    :page-size="pageSize"
    :columns="columns"
    :searchable="searchable"
    :sortable="sortable"
    :pagination="pagination"
    :exclude-columns="excludeColumns"
    :extra-filters="extraFilters"
  >
    <template #page-data="{ row }">
      <NuxtLink
        :to="`/dashboard/site/${siteId}/pages/${encodeURIComponent(row.page)}`"
        class="text-blue-600 hover:underline truncate max-w-[300px] block text-xs"
        :title="row.page"
      >
        {{ pageToPath(row.page) }}
      </NuxtLink>
    </template>
    <template #clicks-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ useHumanFriendlyNumber(row.clicks) }}
        <TrendPercentage v-if="row.prevClicks !== undefined" compact :value="row.clicks" :prev-value="row.prevClicks" />
      </div>
    </template>
    <template #impressions-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ useHumanFriendlyNumber(row.impressions) }}
      </div>
    </template>
    <template #position-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ useHumanFriendlyNumber(row.position, 1) }}
        <TrendPercentage v-if="row.prevPosition !== undefined" compact negative :value="row.position" :prev-value="row.prevPosition" />
      </div>
    </template>
    <template #ctr-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ useHumanFriendlyNumber(row.ctr * 100, 1) }}%
      </div>
    </template>
    <template #topKeyword-data="{ row }">
      <span v-if="row.topKeyword" class="text-xs text-gray-500 truncate max-w-[120px] block">
        {{ row.topKeyword }}
      </span>
      <span v-else class="text-xs text-gray-400">-</span>
    </template>
  </GscdumpTable>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  siteId: string
  period?: import('~/composables/useGscdump').Period
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
  pagination?: boolean
  excludeColumns?: string[]
  extraFilters?: Array<{ type: string, column: string, value: string }>
}>(), {
  pageSize: 10,
  searchable: true,
  sortable: true,
  pagination: true,
})

const columns = [
  { key: 'query', label: 'Keyword', sortable: true },
  { key: 'clicks', label: 'Clicks', sortable: true, class: 'w-20 text-right' },
  { key: 'impressions', label: 'Views', sortable: true, class: 'w-20 text-right' },
  { key: 'position', label: 'Position', sortable: true, class: 'w-20 text-right' },
  { key: 'ctr', label: 'CTR', sortable: true, class: 'w-16 text-right' },
  { key: 'topPage', label: 'Top Page', class: 'w-32' },
  { key: 'searchVolume', label: 'Volume', sortable: true, class: 'w-16 text-right' },
]
</script>

<template>
  <GscdumpTable
    :site-id="siteId"
    dimension="query"
    :period="period"
    :page-size="pageSize"
    :columns="columns"
    :searchable="searchable"
    :sortable="sortable"
    :pagination="pagination"
    :exclude-columns="excludeColumns"
    :extra-filters="extraFilters"
  >
    <template #query-data="{ row }">
      <NuxtLink
        :to="`/dashboard/site/${siteId}/keywords/${encodeURIComponent(row.query)}`"
        class="text-blue-600 hover:underline truncate max-w-[250px] block text-xs"
        :title="row.query"
      >
        {{ row.query }}
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
    <template #topPage-data="{ row }">
      <span v-if="row.topPage" class="text-xs text-gray-500 truncate max-w-[120px] block" :title="row.topPage">
        {{ row.topPage }}
      </span>
      <span v-else class="text-xs text-gray-400">-</span>
    </template>
    <template #searchVolume-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ row.searchVolume ? useHumanFriendlyNumber(row.searchVolume) : '-' }}
      </div>
    </template>
  </GscdumpTable>
</template>

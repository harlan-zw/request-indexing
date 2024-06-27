<script lang="ts" setup>
import type { TableAsyncDataProps } from '~/components/Table/TableAsyncData.vue'

const props = withDefaults(defineProps<{
  site: any
  filter?: string
  excludeColumns?: string[]
} & TableAsyncDataProps>(), {
  searchable: true,
})

const columns = [
  { key: 'keyword', label: 'Keyword' },
  { key: 'competitionIndex', label: 'Competition', sortable: true },
  { key: 'currentMonthSearchVolume', label: 'Volume', sortable: true },
  { key: 'trend', label: 'Trend', sortable: true },
  { key: 'averageCpcMicros', label: 'CPC', sortable: true },
  { key: 'lastSynced', label: 'Last Synced', sortable: true },
  { key: 'actions' },
].filter(column => !props.excludeColumns?.includes(column.key))

const filters = [
  {
    key: 'long-tail',
    label: 'Long tail',
    special: true,
  },
]

function colorForCompetition(competition: 'MEDIUM' | 'LOW' | 'HIGH') {
  switch (competition) {
    case 'MEDIUM':
      return 'yellow'
    case 'LOW':
      return 'green'
    case 'HIGH':
      return 'red'
  }
}
</script>

<template>
  <TableAsyncData :sort="sort" :path="`/api/sites/${site.siteId}/keyword-search-volumes`" :searchable="searchable" :page-size="pageSize" :columns="columns" :filter="filter" :filters="filters" :expandable="expandable">
    <template #keyword-data="{ row, value: totals, expanded }">
      <div class="flex items-center">
        <div class="relative group w-[225px] truncate text-ellipsis">
          <ProgressPercent class="" :value="row.currentVolume" :total="totals?.totalClicks">
            <div class="">
              <NuxtLink :href="`/dashboard/site/${site.siteId}/keywords/${encodeURIComponent(row.keyword)}`" :title="`Open ${row.path}`" class="max-w-[260px] transition py-1 rounded text-xs hover:bg-gray-100 block" color="gray">
                <div class="text-black max-w-[260px] truncate text-ellipsis">
                  {{ row.keyword }}
                </div>
                <!--              <UBadge v-if="!row.prevImpressions" size="xs" variant="subtle"> -->
                <!--                <span class="text-[10px]">New</span> -->
                <!--              </UBadge> -->
                <!--              <UBadge v-else-if="row.lost" size="xs" color="red" variant="subtle"> -->
                <!--                <span class="text-[10px]">Lost</span> -->
                <!--              </UBadge> -->
              </NuxtLink>
            </div>
          </ProgressPercent>
        </div>
      </div>
      <div v-if="expanded" class="relative w-[225px] h-[200px]">
        <GraphKeywords v-if="graph" :key="graph.key" :value="graph.position" :value2="graph.ctr" height="200" />
      </div>
    </template>
    <template #trend-data="{ row }">
      <TrendPercentage :value="row.currentMonthSearchVolume" :prev-value="row.avgMonthlySearches" />
    </template>
    <template #currentMonthSearchVolume-data="{ row }">
      <span class="">{{ useHumanFriendlyNumber(row.currentMonthSearchVolume) }}</span>
    </template>
    <template #avgMonthlySearches-data="{ row }">
      <div class="flex gap-1 items-center">
        <span class="">{{ useHumanFriendlyNumber(row.avgMonthlySearches) }}</span>
      </div>
    </template>
    <template #competitionIndex-data="{ row }">
      <ProgressPercent :value="row.competitionIndex" :color="colorForCompetition(row.competition)" class="w-[100px]">
        <span class="text-xs text-gray-400">{{ row.competition }}</span>
      </ProgressPercent>
    </template>
    <template #averageCpcMicros-data="{ row }">
      <div class="flex items-center">
        ${{ useHumanFriendlyNumber(row.averageCpcMicros / 1_000_000) }}
      </div>
    </template>
    <template #lastSynced-data="{ row }">
      <div class="flex items-center text-xs">
        {{ useTimeAgo(row.lastSynced) }}
      </div>
    </template>
    <template #actions-data>
      <UDropdown :items="[]">
        <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
      </UDropdown>
    </template>
  </TableAsyncData>
</template>

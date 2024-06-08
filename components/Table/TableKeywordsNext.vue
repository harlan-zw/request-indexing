<script setup lang="ts">
import type { GscDataRow } from '~/types/data'
import { exponentialMovingAverage } from '~/lib/time-smoothing/exponentialMovingAverage'
import { simpleMovingAverage } from '~/lib/time-smoothing/simpleMovingAverage'
import { callFnSyncToggleRef } from '~/composables/loader'
import type { SiteSelect } from '~/server/database/schema'
import type { TableAsyncDataProps } from '~/components/Table/TableAsyncData.vue'

const props = withDefaults(
  defineProps<{
    site: SiteSelect
    sortable?: boolean
    excludeColumns?: string[]
  } & TableAsyncDataProps>(),
  {
    searchable: true,
    sortable: true,
    pagination: true,
    expandable: true,
    pageSize: 8,
  },
)

const { session } = useUserSession()

const columns = computed(() => {
  // if (filter.value === 'lost') {
  //   return [{
  //     key: 'keyword',
  //     label: 'Keyword',
  //     sortable: true,
  //   }, {
  //     key: 'prevPosition',
  //     label: 'Prev. Position',
  //     sortable: true,
  //   }, {
  //     key: 'prevCtr',
  //     label: 'Prev. CTR',
  //     sortable: true,
  //   }]
  // }
  return [{
    key: 'keyword',
    label: 'Keyword',
    sortable: props.sortable,
  }, {
    key: 'clicks',
    label: 'Clicks',
    sortable: props.sortable,
  }, {
    key: 'impressions',
    label: 'Impressions',
    sortable: props.sortable,
  }, props.filter?.startsWith('path')
    ? undefined
    : {
        key: 'page',
        label: 'Top Page',
        sortable: props.sortable,
      }, {
    key: 'position',
    label: 'Position',
    sortable: props.sortable,
  }, {
    key: 'positionPercent',
    label: '%',
    sortable: props.sortable,
  }, {
    key: 'currentMonthSearchVolume',
    label: 'Volume',
    sortable: props.sortable,
  }, {
    key: 'competitionIndex',
    label: 'Competition',
    sortable: props.sortable,
  },
  /* {
    key: 'ctr',
    label: 'CTR',
    sortable: true,
  }, {
    key: 'ctrPercent',
    label: '%',
    sortable: true,
  }, */ {
    key: 'actions',
  }].filter(Boolean).filter((col) => {
    return !(props.excludeColumns || []).includes(col.key)
  })
})

// const siteUrlFriendly = useFriendlySiteUrl(props.siteUrl)

const expandedRowData = ref(null)
const expandedRowDataPending = ref(null)

async function updateExpandedData(row: GscDataRow) {
  if (row) {
    await callFnSyncToggleRef(async () => {
      expandedRowData.value = await $fetch(`/api/sites/${encodeURIComponent(props.site.domain)}/keywords/${encodeURIComponent(row.keyword)}`)
    }, expandedRowDataPending)
  }
  else {
    expandedRowData.value = null
  }
}

const graph = computed(() => {
  const rows = expandedRowData.value?.dates
  if (!rows)
    return []
  const dates = rows.map(row => row.date)
  let position = rows.map(row => row.position)
  let ctr = rows.map(row => row.ctr * 100)
  let smoothLineFn = (x: number[]) => x
  if (session.value.smoothLines === 'ema')
    smoothLineFn = exponentialMovingAverage
  else if (session.value.smoothLines === 'sma')
    smoothLineFn = simpleMovingAverage
  position = smoothLineFn(position)
  ctr = smoothLineFn(ctr)
  return {
    key: `${session.value.smoothLines}-${session.value.metricFilter}`,
    position: position.map((value, index) => ({ time: dates[index], value })),
    ctr: ctr.map((value, index) => ({ time: dates[index], value })),
  }
})

// function highestRowClickCount(rows) {
//   return rows.reduce((acc, row) => acc + row.clicks, 0)
// }
//
// const selected = ref([])
// function select(row) {
//   const index = selected.value.findIndex(item => item.url === row.url)
//   if (index === -1)
//     selected.value.push(row)
//   else
//     selected.value.splice(index, 1)
// }

const filters = props.filters || [
  {
    key: 'new',
    label: 'New',
  },
  {
    key: 'lost',
    label: 'Lost',
  },
  {
    key: 'improving',
    label: 'Improving',
  },
  {
    key: 'declining',
    label: 'Declining',
  },
  {
    key: 'non-branded',
    label: 'Non-branded',
    special: true,
  },
  {
    key: 'first-page',
    label: 'First Page',
    special: true,
  },
  {
    key: 'content-gap',
    label: 'Content Gap',
    special: true,
  },
  {
    key: 'questions',
    label: 'Questions',
    special: true,
  }
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
  <div>
    <TableAsyncData :pagination="pagination" :searchable="searchable" :page-size="pageSize" :path="`/api/sites/${site.siteId}/keywords`" :columns="columns" :filter="filter" :filters="filters" :expandable="expandable" @update:expanded="updateExpandedData">
      <template #keyword-data="{ row, value: totals, expanded }">
        <div class="flex items-center">
          <div class="relative group w-[225px] truncate text-ellipsis">
            <ProgressPercent class="" :value="row.clicks" :total="totals?.totalClicks">
              <div class="">
                <NuxtLink :href="`/dashboard/site/${site.siteId}/keywords/${encodeURIComponent(row.keyword)}`" :title="`Open ${row.path}`" class="max-w-[260px] transition py-1 rounded text-xs hover:bg-gray-100 block" color="gray">
                  <div class="text-black max-w-[260px] truncate text-ellipsis">
                    {{ row.keyword }}
                  </div>
                  <UBadge v-if="!row.prevImpressions" size="xs" variant="subtle">
                    <span class="text-[10px]">New</span>
                  </UBadge>
                  <UBadge v-else-if="row.lost" size="xs" color="red" variant="subtle">
                    <span class="text-[10px]">Lost</span>
                  </UBadge>
                </NuxtLink>
              </div>
            </ProgressPercent>
          </div>
        </div>
        <div v-if="expanded" class="relative w-[225px] h-[200px]">
          <GraphKeywords v-if="graph" :key="graph.key" :value="graph.position" :value2="graph.ctr" height="200" />
        </div>
      </template>
      <template #currentMonthSearchVolume-data="{ row }">
        <span class="">{{ useHumanFriendlyNumber(row.currentMonthSearchVolume) }}</span>
      </template>
      <template #competitionIndex-data="{ row }">
        <ProgressPercent :value="row.competitionIndex" :color="colorForCompetition(row.competition)" class="w-[100px]">
          <span class="text-xs text-gray-400">{{ row.competition }}</span>
        </ProgressPercent>
      </template>

      <template #page-data="{ row, expanded }">
        <div v-if="!expanded" class="flex items-center">
          <NuxtLink v-if="row.pages?.[0]" :title="row.pages[0].path" variant="link" size="xs" :to="`/dashboard/site/${site.domain}/pages?q=${encodeURIComponent(row.pages[0].path)}`" color="gray">
            <div class="flex items-center">
              <div class="max-w-[175px] text-[11px] text-xs truncate text-ellipsis">
                {{ row.pages[0].path }}
              </div>
              <PositionMetric :value="row.pages[0].position" size="sm" />
            </div>
          </NuxtLink>
        </div>
        <div v-else>
          <ul class="space-y-2">
            <li v-for="(p, key) in expandedRowData?.pages || []" :key="key">
              <UButton :title="p.path" variant="link" size="xs" :to="`/dashboard/site/${site.domain}/pages?q=${encodeURIComponent(p.path)}`" color="gray">
                <div>
                  <div class="max-w-[150px] truncate text-ellipsis">
                    {{ p.path }}
                  </div>
                </div>
              </UButton>
              <div class="text-xs">
                <PositionMetric :value="p.position" />
                {{ useHumanFriendlyNumber(p.clicks) }} clicks, {{ useHumanFriendlyNumber(p.ctr * 100) }}% CTR
              </div>
            </li>
          </ul>
        </div>
      </template>
      <template #clicks-data="{ row }">
        <div class="text-center">
          <UDivider v-if="row.lostKeyword" />
          <div v-else class="flex gap-1">
            <EmptyPlaceholder v-if="Number(row.clicks) === 0" />
            <template v-else>
              <ProgressPercent class="" :value="useHumanFriendlyNumber(row.ctr * 100)" :total="100" :tooltip="`${useHumanFriendlyNumber(row.ctr * 100)}% click through rate`">
                <div class="flex items-center gap-1">
                  <IconClicks class="opacity-70 !w-3 !h-3" />
                  <div class="flex mb-1 items-center justify-center gap-2">
                    {{ useHumanFriendlyNumber(row.clicks) }}
                  </div>
                </div>
              </ProgressPercent>
            </template>
          </div>
        </div>
      </template>
      <template #impressions-data="{ row }">
        <EmptyPlaceholder v-if="Number(row.impressions) === 0" />
        <template v-else>
          <ProgressPercent color="purple" :value="10 - row.position" :total="10" :tooltip="`Avg. position ${useHumanFriendlyNumber(row.position)}`">
            <div class="flex items-center gap-1">
              <IconImpressions class="opacity-70 !w-3 !h-3" />
              <div class="flex mb-1 items-center justify-center gap-2">
                {{ useHumanFriendlyNumber(row.impressions) }}
              </div>
            </div>
          </ProgressPercent>
        </template>
      </template>
      <template #position-data="{ row }">
        <div class="text-center">
          <UDivider v-if="row.lostKeyword" />
          <template v-else>
            <div>
              <PositionMetric :value="row.position" />
            </div>
          </template>
        </div>
      </template>
      <template #prevPosition-data="{ row }">
        <div class="text-center">
          <div>
            {{ useHumanFriendlyNumber(row.prevPosition, 1) }}
          </div>
          <UTooltip :text="`${row.prevImpressions} impressions`">
            <div class="text-xs">
              {{ useHumanFriendlyNumber(row.prevImpressions) }} impressions
            </div>
          </UTooltip>
        </div>
      </template>
      <template #positionPercent-data="{ row }">
        <UDivider v-if="!row.prevPosition" />
        <TrendPercentage v-else :value="row.position" :prev-value="row.prevPosition" symbol="%" />
      </template>
      <template #ctr-data="{ row }">
        <div class="text-center">
          <div>{{ useHumanFriendlyNumber(row.ctr * 100, 1) }}%</div>
        </div>
      </template>
      <template #prevCtr-data="{ row }">
        <div class="text-center">
          <div>
            {{ useHumanFriendlyNumber(row.prevCtr * 100, 1) }}%
          </div>
          <UTooltip :text="`${row.prevClicks} clicks`">
            <div class="text-xs">
              {{ useHumanFriendlyNumber(row.prevClicks) }} clicks
            </div>
          </UTooltip>
        </div>
      </template>
      <template #ctrPercent-data="{ row }">
        <TrendPercentage v-if="row.prevCtr" :value="row.ctr * 100" :prev-value="row.prevCtr * 100" symbol="%" />
        <UDivider v-else />
      </template>
      <template #actions-data>
        <UDropdown :items="[]">
          <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
        </UDropdown>
      </template>
    </TableAsyncData>
  </div>
</template>

<script setup lang="ts">
import type { GoogleSearchConsoleSite, GscDataRow } from '~/types/data'
import { exponentialMovingAverage } from '~/lib/time-smoothing/exponentialMovingAverage'
import { simpleMovingAverage } from '~/lib/time-smoothing/simpleMovingAverage'
import { callFnSyncToggleRef } from '~/composables/loader'

const props = withDefaults(
  defineProps<{ mock?: boolean, value?: GscDataRow[], site: GoogleSearchConsoleSite, pending?: boolean, pageCount?: number }>(),
  {
    pageCount: 8,
  },
)

const { user, session } = useUserSession()

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
    sortable: true,
  }, {
    key: 'page',
    label: 'Top Page',
    sortable: true,
  }, {
    key: 'position',
    label: 'Position',
    sortable: true,
  }, user.value.analyticsPeriod === 'all'
    ? null
    : {
        key: 'positionPercent',
        label: '%',
        sortable: true,
      }, {
    key: 'ctr',
    label: 'CTR',
    sortable: true,
  }, user.value.analyticsPeriod === 'all'
    ? null
    : {
        key: 'ctrPercent',
        label: '%',
        sortable: true,
      }, {
    key: 'actions',
  }].filter(Boolean)
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

function highestRowClickCount(rows) {
  return rows.reduce((acc, row) => acc + row.clicks, 0)
}
//
// const selected = ref([])
// function select(row) {
//   const index = selected.value.findIndex(item => item.url === row.url)
//   if (index === -1)
//     selected.value.push(row)
//   else
//     selected.value.splice(index, 1)
// }

const filters = computed(() => {
  return [
    {
      key: 'new',
      label: 'New',
      filter: (rows: T[]) => {
        return rows.filter(row => !row.prevImpressions)
      },
    },
    {
      key: 'lost',
      label: 'Lost',
      filter: (rows: T[]) => {
        return rows.filter(row => row.lost).sort((a, b) => b.prevImpressions - a.prevImpressions)
      },
    },
    {
      key: 'improving',
      label: 'Improving',
      filter: (rows: T[]) => {
        return rows.filter(row => row.clicks > row.prevClicks)
      },
    },
    {
      key: 'declining',
      label: 'Declining',
      filter: (rows: T[]) => {
        return rows.filter(row => row.clicks < row.prevClicks)
      },
    },
    {
      key: 'first-page',
      label: 'First Page',
      special: true,
      filter: (rows: GscDataRow[]) => rows.filter(row => row.impressions > 5 && row.position <= 12 && row.position >= 0),
    },
    {
      key: 'content-gap',
      label: 'Content Gap',
      special: true,
      filter: (rows: GscDataRow[]) => {
        // compute avg. impressions and avg ctr
        const avgImpressions = rows.filter(row => row.impressions >= 0).reduce((acc, row) => acc + (row.impressions || 0), 0) / rows.length
        const avgCtr = rows.filter(row => row.ctr >= 0).reduce((acc, row) => acc + (row.ctr || 0), 0) / rows.length
        const thresholdImpressions = Math.max(avgImpressions * 0.5, 50)
        const thresholdCTR = avgCtr * 0.5
        return rows.filter(row => row.impressions > thresholdImpressions && row.ctr < thresholdCTR)
          .sort((a, b) => b.impressions - a.impressions)
      },
    },
  ]
})
</script>

<template>
  <div>
    <TableData :value="value" :columns="columns" :filters="filters" @update:expanded="updateExpandedData">
      <template #keyword-data="{ row, rows, expanded }">
        <div class="flex items-center">
          <div class="relative group w-[225px] truncate text-ellipsis">
            <div class="flex items-center">
              <UButton class="max-w-[185px] block" variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" color="gray" @click="q = row.keyword">
                <div class="text-black max-w-[185px] truncate text-ellipsis">
                  {{ row.keyword }}
                </div>
              </UButton>
              <UBadge v-if="!row.prevPosition" size="xs" variant="subtle">
                New
              </UBadge>
              <UBadge v-else-if="row.lost" size="xs" color="red" variant="subtle">
                Lost
              </UBadge>
            </div>
            <UProgress :value="Math.round((row.clicks / highestRowClickCount(rows)) * 100)" color="blue" size="xs" class="ml-2 opacity-75 group-hover:opacity-100 transition" />
          </div>
        </div>
        <div v-if="expanded" class="relative w-[225px] h-[200px]">
          <GraphKeywords v-if="graph" :key="graph.key" :value="graph.position" :value2="graph.ctr" height="200" />
        </div>
      </template>

      <template #page-data="{ row, expanded }">
        <div v-if="!expanded" class="flex items-center">
          <UButton :title="row.page" variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" :to="`/dashboard/site/${site.domain}/pages?q=${encodeURIComponent(row.page)}`" color="gray">
            <div class="max-w-[150px] truncate text-ellipsis">
              {{ row.page }}
            </div>
          </UButton>
        </div>
        <div v-else>
          <ul class="space-y-2">
            <li v-for="(p, key) in expandedRowData?.pages || []" :key="key">
              <UButton :title="p.page" variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" :to="`/dashboard/site/${site.domain}/pages?q=${encodeURIComponent(p.page)}`" color="gray">
                <div>
                  <div class="max-w-[150px] truncate text-ellipsis">
                    {{ p.page }}
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
      <template #position-data="{ row }">
        <div class="text-center">
          <UDivider v-if="row.lostKeyword" />
          <template v-else>
            <div>
              <PositionMetric :value="row.position" />
            </div>
            <UTooltip :text="`${row.impressions} impressions`">
              <div class="text-xs flex items-center gap-1">
                {{ useHumanFriendlyNumber(row.impressions) }}
                <IconImpressions />
              </div>
            </UTooltip>
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
          <UTooltip :text="`${row.clicks} impressions`">
            <div class="text-xs flex items-center gap-1">
              {{ useHumanFriendlyNumber(row.clicks) }}
              <IconClicks />
            </div>
          </UTooltip>
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
    </TableData>
  </div>
</template>

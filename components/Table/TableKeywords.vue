<script setup lang="ts">
import Fuse from 'fuse.js'
import type { GoogleSearchConsoleSite } from '~/types/data'

const props = withDefaults(
  defineProps<{ mock?: boolean, value?: GscDataRow[], site: GoogleSearchConsoleSite, pending?: boolean, pageCount?: number }>(),
  {
    pageCount: 8,
  },
)

const { user } = useUserSession()

const columns = computed(() => {
  return [{
    key: 'keyword',
    label: 'Keyword',
    sortable: true,
  }, {
    key: 'position',
    label: 'Position',
    sortable: true,
  }, user.value?.analyticsPeriod === 'all'
    ? null
    : {
        key: 'positionPercent',
        label: '%',
        sortable: true,
      }, {
    key: 'ctr',
    label: 'CTR',
    sortable: true,
  }, user.value?.analyticsPeriod === 'all'
    ? null
    : {
        key: 'ctrPercent',
        label: '%',
        sortable: true,
      }].filter(Boolean)
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
      description: 'Keywords that are new verse the previous period.',
      filter: (rows: T[]) => {
        return rows.filter(row => !row.prevPosition)
      },
    },
    {
      key: 'improving',
      description: 'Keywords that are improving verse the previous period.',
      label: 'Improving',
      filter: (rows: T[]) => {
        return rows.filter(row => row.position > row.prevPosition)
      },
    },
    {
      key: 'declining',
      description: 'Keywords that are declining verse the previous period.',
      label: 'Declining',
      filter: (rows: T[]) => {
        return rows.filter(row => row.position < row.prevPosition)
      },
    },
    {
      key: 'first-page',
      label: 'First Page',
      description: 'Keywords that are on the first page of Google search',
      special: true,
      filter: (rows: GscDataRow[]) => rows.filter(row => row.impressions > 5 && row.position <= 12 && row.position >= 0),
    },
    {
      key: 'content-gap',
      label: 'Content Gap',
      description: 'Keywords that are not on the first page but have high impressions',
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
    {
      key: 'indirect',
      label: 'Indirect',
      description: 'Keywords with impressions that don\'t include the site name',
      special: true,
      filter: (rows: GscDataRow[]) => {
        // only with 1 clicks
        const trafficRows = rows.filter(row => row.impressions >= 10)
        // use fuse.js, add all data, search for the siteurl and see what' not returned
        const fuse = new Fuse(trafficRows, {
          keys: ['keyword'],
          includeScore: true,
          threshold: 0.5,
        })
        const siteName = props.site.siteUrl.replace('www.', '').replace('https://', '').replace('sc-domain:', '').split('.')[0]
        const results = fuse.search(siteName)
        // do a diff of results on rows, we only want the ones that are not returned
        return trafficRows.filter(row => !results.find(result => result.item.keyword === row.keyword))
      },
    },
  ]
})
</script>

<template>
  <div>
    <TableData :value="value" :columns="columns" :filters="filters" :page-count="pageCount">
      <template #keyword-data="{ row, rows }">
        <div class="flex items-center">
          <div class="relative group w-[225px] truncate text-ellipsis">
            <div class="flex items-center">
              <UButton class="max-w-[185px] block" variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" color="gray" @click="q = row.keyword">
                <div class="text-black dark:text-white max-w-[185px] truncate text-ellipsis">
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

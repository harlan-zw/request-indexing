<script setup lang="ts">
import { withLeadingSlash, withoutLeadingSlash } from 'ufo'
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

const columns = computed(() => [
  {
    key: 'url',
    label: 'URL',
    sortable: true,
  },
  {
    key: 'keywordPosition',
    label: 'Top Keyword',
    sortable: true,
  },
  user.value.disabledMetrics?.includes('clicks')
    ? null
    : {
        key: 'clicks',
        label: 'Clicks',
        sortable: true,
      },
  (user.value.analyticsPeriod === 'all' || user.value.disabledMetrics?.includes('clicks'))
    ? null
    : {
        key: 'clicksPercent',
        label: '%',
        sortable: true,
      },
  user.value.disabledMetrics?.includes('impressions')
    ? null
    : {
        key: 'impressions',
        label: 'Impressions',
        sortable: true,
      },
  (user.value.analyticsPeriod === 'all' || user.value.disabledMetrics?.includes('impressions'))
    ? null
    : {
        key: 'impressionsPercent',
        label: '%',
        sortable: true,
      },
  {
    key: 'actions',
  },
].filter(Boolean))

const filters = [
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
    key: 'top-level',
    special: true,
    label: 'Top Level',
    filter: (_rows: GscDataRow[]) => {
      const topLevelPaths = _rows.map(row => row.url.split('/').slice(1, 2)?.[0] || false)
      const uniqueTopLevelPaths = Array.from(new Set(topLevelPaths)).filter(Boolean)
      return uniqueTopLevelPaths.map((topLevelPath) => {
        const rows = _rows.filter(row => withoutLeadingSlash(row.url).startsWith(topLevelPath))
        const clicks = rows.reduce((acc, row) => acc + row.clicks, 0)
        const prevClicks = rows.reduce((acc, row) => acc + row.prevClicks, 0)
        const impressions = rows.reduce((acc, row) => acc + row.impressions, 0)
        const prevImpressions = rows.reduce((acc, row) => acc + row.prevImpressions, 0)
        // compute the avg keyword position
        const avgKeywordPosition = rows.reduce((acc, row) => acc + (row.keywordPosition || 0), 0) / rows.length
        return {
          url: withLeadingSlash(topLevelPath),
          keyword: rows[0].keyword,
          keywordPosition: avgKeywordPosition,
          clicks,
          prevClicks,
          impressions,
          prevImpressions,
        }
      })
    },
  },
]
// const siteUrlFriendly = useFriendlySiteUrl(props.siteUrl)

const expandedRowData = ref(null)
const expandedRowDataPending = ref(null)

async function updateExpandedData(row: GscDataRow) {
  if (row) {
    await callFnSyncToggleRef(async () => {
      expandedRowData.value = await $fetch(`/api/sites/${encodeURIComponent(props.site.domain)}/pages/${encodeURIComponent(row.url)}`)
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
  let clicks = rows.map(row => row.clicks)
  let impressions = rows.map(row => row.impressions * 100)
  let smoothLineFn = (x: number[]) => x
  if (session.value.smoothLines === 'ema')
    smoothLineFn = exponentialMovingAverage
  else if (session.value.smoothLines === 'sma')
    smoothLineFn = simpleMovingAverage
  clicks = smoothLineFn(clicks)
  impressions = smoothLineFn(impressions)
  return {
    key: `${session.value.smoothLines}-${session.value.metricFilter}`,
    clicks: clicks.map((value, index) => ({ time: dates[index], value })),
    impressions: impressions.map((value, index) => ({ time: dates[index], value })),
  }
})

function highestRowClickCount(rows) {
  // do a sum of all clicks
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

function openUrl(url: string, target?: string) {
  window.open(url, target)
}
</script>

<template>
  <div>
    <TableData :value="value" :columns="columns" :filters="filters" @update:expanded="updateExpandedData">
      <template #url-data="{ row, rows, expanded }">
        <div class="flex items-center">
          <div class="relative group w-[260px] max-w-full">
            <div class="flex items-center">
              <UButton :title="`Open ${row.url}`" class="max-w-[260px]" variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" target="_blank" color="gray" @click="q = row.url">
                <div class="max-w-[220px] truncate text-ellipsis">
                  {{ row.url }}
                </div>
              </UButton>
              <UBadge v-if="!row.prevImpressions" size="xs" variant="subtle">
                New
              </UBadge>
              <UBadge v-else-if="row.lost" size="xs" color="red" variant="subtle">
                Lost
              </UBadge>
            </div>
            <UTooltip :text="`${Math.round((row.clicks / highestRowClickCount(rows)) * 100)}% of clicks`" class="w-full block">
              <UProgress :value="Math.round((row.clicks / highestRowClickCount(rows)) * 100)" color="blue" size="xs" class="ml-2 opacity-75 group-hover:opacity-100 transition py-1" />
            </UTooltip>
            <!--            <div v-if="row.inspectionResult" class="text-xs text-gray-500 flex items-center"> -->
            <!--              <UTooltip v-if="row.inspectionResult?.inspectionResultLink" mode="hover" text="View Inspection Result" size="xs"> -->
            <!--                <UButton target="_blank" :to="row.inspectionResult?.inspectionResultLink" icon="i-heroicons-document-magnifying-glass" color="gray" variant="link" size="xs" /> -->
            <!--              </UTooltip> -->
            <!--              Crawled {{ useTimeAgo(row.inspectionResult.indexStatusResult.lastCrawlTime) }} -->
            <!--            </div> -->
          </div>
        </div>
        <div v-if="expanded" class="">
          <div class="relative w-[350px] h-[200px] mb-2">
            <div v-if="expandedRowDataPending" class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-arrow-path" class="animate-spin w-12 h-12" />
            </div>
            <GraphClicks v-else-if="graph" :key="graph.key" :value="graph.clicks" :value2="graph.impressions" height="200" />
          </div>
        </div>
      </template>
      <template #keywordPosition-data="{ row, expanded }">
        <div v-if="!expanded" class="flex items-center">
          <UButton :title="row.keyword" variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" :to="`/dashboard/site/${site.domain}/keywords?q=${encodeURIComponent(row.keyword)}`" color="gray">
            <div class="max-w-[150px] truncate text-ellipsis">
              <PositionMetric :value="row.keywordPosition" />
              {{ row.keyword }}
            </div>
          </UButton>
        </div>
        <div v-else>
          <ul>
            <li v-for="(keyword, i) in expandedRowData?.keywords || []" :key="i">
              <UButton variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" :to="`/dashboard/site/${site.domain}/keywords?q=${encodeURIComponent(keyword.keyword)}`" target="_blank" color="gray">
                <div>
                  <div class="max-w-[250px] truncate text-ellipsis">
                    <PositionMetric :value="keyword.position" />
                    {{ keyword.keyword }}
                  </div>
                </div>
              </UButton>
              <div class="text-xs">
                {{ useHumanFriendlyNumber(keyword.clicks) }} clicks, {{ useHumanFriendlyNumber(keyword.ctr * 100) }}% CTR
              </div>
            </li>
          </ul>
        </div>
      </template>
      <template #clicks-data="{ row }">
        <div class="text-center">
          <UDivider v-if="row.lostPage" />
          <UTooltip v-else :text="row.clicks" class="flex items-center justify-center gap-1">
            <IconClicks />
            {{ useHumanFriendlyNumber(row.clicks) }}
          </UTooltip>
        </div>
      </template>
      <template #clicksPercent-data="{ row }">
        <UDivider v-if="!row.prevImpressions" />
        <TrendPercentage v-else :value="row.clicks" :prev-value="row.prevClicks" />
      </template>
      <template #impressions-data="{ row }">
        <UTooltip :text="row.impressions" class="flex items-center justify-center gap-1">
          <IconImpressions />
          {{ useHumanFriendlyNumber(row.impressions) }}
        </UTooltip>
      </template>
      <template #impressionsPercent-data="{ row }">
        <UDivider v-if="!row.prevImpressions" />
        <TrendPercentage v-else :value="row.impressions" :prev-value="row.prevImpressions" />
      </template>
      <template #actions-data="{ row }">
        <UDropdown :items="[[{ label: 'Open URL', click: () => openUrl(row.url, '_blank') }], [{ label: 'URL Inspections', icon: 'i-heroicons-document-magnifying-glass', disabled: true }, (row.inspectionResult?.inspectionResultLink ? { label: 'View Inspection Result' } : undefined), { label: 'Inspect Index Status' }].filter(Boolean)]">
          <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
        </UDropdown>
      </template>
    </TableData>
  </div>
</template>
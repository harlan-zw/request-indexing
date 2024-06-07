<script setup lang="ts">
import type { GscDataRow } from '~/types/data'
import { callFnSyncToggleRef } from '~/composables/loader'
import type { SiteSelect } from '~/server/database/schema'

const props = withDefaults(
  defineProps<{ site: SiteSelect, pageCount?: number, filter?: string }>(),
  {
    pageCount: 8,
  },
)

const page = ref(1)

const columns = computed(() => [
  {
    key: 'page',
    label: 'Page',
    sortable: true,
  },
  {
    key: 'position',
    label: 'Position',
    sortable: true,
  },
  {
    key: 'positionPercent',
    label: '%',
    sortable: true,
  },
  {
    key: 'clicks',
    label: 'Clicks',
    sortable: true,
  },
  {
    key: 'clicksPercent',
    label: '%',
    sortable: true,
  },
  {
    key: 'impressions',
    label: 'Impressions',
    sortable: true,
  },
  {
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
    key: 'top-level',
    special: true,
    label: 'Top Level',
  },
]
// const siteUrlFriendly = useFriendlySiteUrl(props.siteUrl)

const expandedRowData = ref(null)
const expandedRowDataPending = ref(null)

async function updateExpandedData(row: GscDataRow) {
  if (row) {
    await callFnSyncToggleRef(async () => {
      expandedRowData.value = await $fetch(`/api/sites/${encodeURIComponent(props.site.domain)}/pages/${encodeURIComponent(row.path)}`)
    }, expandedRowDataPending)
  }
  else {
    expandedRowData.value = null
  }
}

function openUrl(page: string, target?: string) {
  window.open(page, target)
}

function pageUrlToPath(url: string) {
  return url
  // return new URL(url).pathname
}
</script>

<template>
  <div>
    <TableAsyncData :path="`/api/sites/${site.siteId}/keyword-pages`" :columns="columns" :filter="filter" :filters="filters" expandable @page-change="p => page = p" @update:expanded="updateExpandedData">
      <template #page-data="{ row, value: totals, expanded }">
        <div class="flex items-center">
          <div class="relative group w-[260px] max-w-full">
            <ProgressPercent class="" :value="row.clicks" :total="totals?.totalClicks">
              <div class="">
                <NuxtLink :href="`/dashboard/site/${site.siteId}/pages/${encodeURIComponent(row.path)}`" :title="`Open ${row.path}`" class="max-w-[260px] transition py-1 rounded text-xs hover:bg-gray-100 block" color="gray">
                  <div class="text-black max-w-[260px] truncate text-ellipsis">
                    {{ pageUrlToPath(row.path) }}
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
            graph
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
          </template>
        </div>
      </template>
      <template #positionPercent-data="{ row }">
        <div class="text-center">
          <TrendPercentage negative :value="Math.round(row.position)" :prev-value="Math.round(row.prevPosition)" />
        </div>
      </template>
      <template #clicks-data="{ row }">
        <div class="text-center">
          <UDivider v-if="row.lostPage" />
          <UTooltip v-else :text="`${row.clicks} clicks this period`" class="flex items-center justify-center gap-1">
            <IconClicks />
            {{ useHumanFriendlyNumber(row.clicks) }}
          </UTooltip>
        </div>
      </template>
      <template #clicksPercent-data="{ row }">
        <UDivider v-if="!row.prevClicks" />
        <TrendPercentage v-else :value="row.clicks" :prev-value="row.prevClicks" />
      </template>
      <template #impressions-data="{ row }">
        <UTooltip :text="`${row.impressions} impressions this period`" class="flex items-center justify-center gap-1">
          <IconImpressions />
          {{ useHumanFriendlyNumber(row.impressions) }}
        </UTooltip>
      </template>
      <template #impressionsPercent-data="{ row }">
        <UDivider v-if="!row.prevImpressions" />
        <TrendPercentage v-else :value="row.impressions" :prev-value="row.prevImpressions" />
      </template>
      <template #actions-data="{ row }">
        <UDropdown :items="[[{ label: 'Open Page', click: () => openUrl(row.path, '_blank') }], [{ label: 'Page Inspections', icon: 'i-heroicons-document-magnifying-glass', disabled: true }, (row.inspectionResult?.inspectionResultLink ? { label: 'View Inspection Result' } : undefined), { label: 'Inspect Index Status' }].filter(Boolean)]">
          <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
        </UDropdown>
      </template>
    </TableAsyncData>
  </div>
</template>

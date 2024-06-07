<script setup lang="ts">
import type { GscDataRow } from '~/types/data'
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

const page = ref(1)

const columns = computed(() => [
  {
    key: 'page',
    label: 'Page',
    sortable: props.sortable,
  },
  {
    key: 'psiScore',
    label: 'PageSpeed',
    sortable: props.sortable,
  },
  {
    key: 'clicks',
    label: 'Clicks',
    sortable: props.sortable,
  },
  {
    key: 'clicksPercent',
    label: '%',
    sortable: props.sortable,
  },
  {
    key: 'impressions',
    label: 'Impressions',
    sortable: props.sortable,
  },
  {
    key: 'impressionsPercent',
    label: '%',
    sortable: props.sortable,
  },
  {
    key: 'keyword',
    label: 'Top Keyword',
    sortable: props.sortable,
  },
  {
    key: 'actions',
  },
].filter(Boolean).filter((col) => {
  return !(props.excludeColumns || []).includes(col.key)
}))

const filters = computed(() => {
  if (typeof props.filters === 'boolean' && !props.filters) {
    return []
  }
  return [
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
})
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
  <TableAsyncData :pagination="pagination" :searchable="searchable" :page-size="pageSize" :path="`/api/sites/${site.siteId}/pages`" :columns="columns" :filters="filters" :expandable="expandable" @page-change="p => page = p" @update:expanded="updateExpandedData">
    <template #page-data="{ row, value: totals, expanded }">
      <div class="flex items-center">
        <div class="relative group w-[260px] max-w-full">
          <ProgressPercent class="" :value="row.clicks" :total="totals?.totalClicks">
            <div class="">
              <NuxtLink :href="`/dashboard/site/${site.siteId}/pages/${encodeURIComponent(row.path)}`" :title="`Open ${row.path}`" class="max-w-[260px] flex items-center justify-between transition py-1 rounded text-xs hover:bg-gray-100 block" color="gray">
                <div class="text-black max-w-[260px] truncate text-ellipsis">
                  {{ pageUrlToPath(row.path) }}
                </div>
                <UBadge v-if="!row.isIndexed" color="gray" size="xs" variant="subtle">
                  <span class="text-[10px]">Not Indexed</span>
                </UBadge>
                <UBadge v-else-if="!row.prevImpressions" size="xs" variant="subtle">
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
    <template #keyword-data="{ row, expanded }">
      <EmptyPlaceholder v-if="!row.keyword" />
      <div v-else-if="!expanded" class="flex items-center">
        <NuxtLink :href="`/dashboard/site/${site.siteId}/keywords/${encodeURIComponent(row.keyword)}`" :title="`Open ${row.keyword}`" class="max-w-[260px] gap-2 transition py-1 flex items-center rounded text-xs hover:bg-gray-100 block" color="gray">
          <div class="max-w-[150px] truncate text-ellipsis">
            {{ row.keyword }}
          </div>
          <PositionMetric size="sm" :value="row.keywordPosition" />
        </NuxtLink>
      </div>
      <!--        <div v-else> -->
      <!--          <ul> -->
      <!--            <li v-for="(keyword, i) in row.keyword || []" :key="i"> -->
      <!--              <UButton variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" :to="`/dashboard/site/${site.domain}/keywords?q=${encodeURIComponent(keyword.keyword)}`" target="_blank" color="gray"> -->
      <!--                <div> -->
      <!--                  <div class="max-w-[250px] truncate text-ellipsis"> -->
      <!--                    <PositionMetric :value="keyword.position" /> -->
      <!--                    {{ keyword.keyword }} -->
      <!--                  </div> -->
      <!--                </div> -->
      <!--              </UButton> -->
      <!--              <div class="text-xs"> -->
      <!--                {{ useHumanFriendlyNumber(keyword.clicks) }} clicks, {{ useHumanFriendlyNumber(keyword.ctr * 100) }}% CTR -->
      <!--              </div> -->
      <!--            </li> -->
      <!--          </ul> -->
      <!--        </div> -->
    </template>
    <template #clicks-data="{ row }">
      <div class="text-center">
        <UDivider v-if="row.lostPage" />
        <div v-else class="flex items-center gap-1">
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
    <template #clicksPercent-data="{ row }">
      <UDivider v-if="!row.prevClicks" />
      <TrendPercentage v-else :value="row.clicks" compact :prev-value="row.prevClicks" />
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
    <template #impressionsPercent-data="{ row }">
      <UDivider v-if="!row.prevImpressions" />
      <TrendPercentage v-else :value="row.impressions" compact :prev-value="row.prevImpressions" />
    </template>
    <template #actions-data="{ row }">
      <UDropdown :items="[[{ label: 'Open Page', click: () => openUrl(row.path, '_blank') }], [{ label: 'Page Inspections', icon: 'i-heroicons-document-magnifying-glass', disabled: true }, (row.inspectionResult?.inspectionResultLink ? { label: 'View Inspection Result' } : undefined), { label: 'Inspect Index Status' }].filter(Boolean)]">
        <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
      </UDropdown>
    </template>
  </TableAsyncData>
</template>

<script setup lang="ts">
import type { GscDataRow } from '~/types/data'
import { callFnSyncToggleRef } from '~/composables/loader'
import type { SiteSelect } from '~/server/database/schema'
import type { TableAsyncDataProps } from '~/components/Table/TableAsyncData.vue'
import audits from '../../audits-clean.json'

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
    key: 'auditId',
    label: 'Audit',
    sortable: props.sortable,
  },
  {
    key: 'count',
    label: 'Occurrences',
    sortable: props.sortable,
  },
  {
    key: 'score',
    label: 'Avg. Score',
    sortable: props.sortable,
  },
  {
    key: 'weight',
    label: 'Weight',
    sortable: props.sortable,
  },
  {
    key: 'path',
    label: 'Paths',
    sortable: props.sortable,
  },
  {
    key: 'actions',
  },
].filter(Boolean).filter((col) => {
  return !(props.excludeColumns || []).includes(col.key)
}))

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
<TableAsyncData :key="filter" :filter="filter" :sort="sort" :pagination="pagination" :searchable="searchable" :page-size="pageSize" :columns="columns" :filters="filters" :expandable="expandable" :path="`/api/sites/${site.siteId}/psi-audits`" @page-change="p => page = p" @update:expanded="updateExpandedData">
  <template #psiMobilePerformance-data="{ row }">
  <div class="flex gap-3 items-center">
    <UTooltip :text="`${row.psiMobilePerformance} score this period`" class="flex items-center justify-center gap-1">
      <UIcon name="i-ph-device-mobile-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
      {{ useHumanFriendlyNumber(row.psiMobilePerformance, 0) }}
    </UTooltip>
    <UTooltip :text="`${row.psiDesktopPerformance} score this period`" class="flex items-center justify-center gap-1">
      <UIcon name="i-ph-desktop-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
      {{ useHumanFriendlyNumber(row.psiDesktopPerformance, 0) }}
    </UTooltip>
  </div>
  </template>
  <template #auditId-data="{ row }">
  <div class="relative group w-[370px] max-w-full">
    <div class="flex items-center gap-2">
      <button type="button" :title="`Open ${row.path}`" class="max-w-[370px] text-xs">
        <div class="max-w-[370px] truncate text-ellipsis">
          {{ audits[row.auditId].title }}
        </div>
      </button>
    </div>
  </div>
  </template>
  <template #psiMobileAccessibility-data="{ row }">
  <div class="flex gap-3 items-center">
    <UTooltip :text="`${row.psiMobileAccessibility} score this period`" class="flex items-center justify-center gap-1">
      <UIcon name="i-ph-device-mobile-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
      {{ useHumanFriendlyNumber(row.psiMobileAccessibility, 0) }}
    </UTooltip>
    <UTooltip :text="`${row.psiDesktopAccessibility} score this period`" class="flex items-center justify-center gap-1">
      <UIcon name="i-ph-desktop-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
      {{ useHumanFriendlyNumber(row.psiDesktopAccessibility, 0) }}
    </UTooltip>
  </div>
  </template>
  <template #psiDesktopScore-data="{ row }">
  <div class="text-left text-lg font-semibold">
    <UTooltip :text="`${row.psiDesktopScore} score this period`" class="flex items-center justify-center gap-1">
      {{ useHumanFriendlyNumber(row.psiDesktopScore, 0) }}
    </UTooltip>
  </div>
  <div class="text-xs flex items-center gap-2">
    <UTooltip :text="`${row.psiDesktopPerformance} score this period`" class="flex items-center justify-center gap-1">
      Performance:
      {{ useHumanFriendlyNumber(row.psiDesktopPerformance, 0) }}
    </UTooltip>
    <UTooltip :text="`${row.psiDesktopAccessibility} score this period`" class="flex items-center justify-center gap-1">
      Accessibility:
      {{ useHumanFriendlyNumber(row.psiDesktopAccessibility, 0) }}
    </UTooltip>
    <UTooltip :text="`${row.psiDesktopBestPractices} score this period`" class="flex items-center justify-center gap-1">
      Best Practices:
      {{ useHumanFriendlyNumber(row.psiDesktopBestPractices, 0) }}
    </UTooltip>
    <UTooltip :text="`${row.psiDesktopSeo} score this period`" class="flex items-center justify-center gap-1">
      SEO:
      {{ useHumanFriendlyNumber(row.psiDesktopSeo, 0) }}
    </UTooltip>
  </div>
  </template>
  <template #psiMobileScore-data="{ row }">
  <div class="text-center text-lg font-semibold">
    <UTooltip :text="`${row.psiMobileScore} score this period`" class="flex items-center justify-center gap-1">
      {{ useHumanFriendlyNumber(row.psiMobileScore, 0) }}
    </UTooltip>
  </div>
  <div class="text-xs flex items-center gap-2">
    <UTooltip :text="`${row.psiMobilePerformance} score this period`" class="flex items-center justify-center gap-1">
      Performance:
      {{ useHumanFriendlyNumber(row.psiMobilePerformance, 0) }}
    </UTooltip>
    <UTooltip :text="`${row.psiMobileAccessibility} score this period`" class="flex items-center justify-center gap-1">
      Accessibility:
      {{ useHumanFriendlyNumber(row.psiMobileAccessibility, 0) }}
    </UTooltip>
    <UTooltip :text="`${row.psiMobileBestPractices} score this period`" class="flex items-center justify-center gap-1">
      Best Practices:
      {{ useHumanFriendlyNumber(row.psiMobileBestPractices, 0) }}
    </UTooltip>
    <UTooltip :text="`${row.psiMobileSeo} score this period`" class="flex items-center justify-center gap-1">
      SEO:
      {{ useHumanFriendlyNumber(row.psiMobileSeo, 0) }}
    </UTooltip>
  </div>
  </template>
  <template #path-data="{ row, expanded }">
  <div class="flex items-center">
    <div class="mr-3 text-xs w-14">
      {{ row.count }} pages
    </div>
    <div class="relative group w-[200px] max-w-full">
      <div class="flex items-center gap-2">
        <button type="button" :title="`Open ${row.path}`" class="max-w-[260px] text-xs">
          <div class="text-black max-w-[200px] text-[10px] truncate text-ellipsis">
            {{ pageUrlToPath(row.path) }}
          </div>
        </button>
      </div>
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
  <template #actions-data="{ row }">
  <UDropdown :items="[[{ label: 'Open Page', click: () => openUrl(row.path, '_blank') }], [{ label: 'Page Inspections', icon: 'i-heroicons-document-magnifying-glass', disabled: true }, (row.inspectionResult?.inspectionResultLink ? { label: 'View Inspection Result' } : undefined), { label: 'Inspect Index Status' }].filter(Boolean)]">
    <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
  </UDropdown>
  </template>
</TableAsyncData>
</template>

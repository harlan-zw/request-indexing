<script setup lang="ts">
import type { GscDataRow } from '~/types/data'
import { callFnSyncToggleRef } from '~/composables/loader'
import type { SiteSelect } from '~/server/database/schema'

const props = withDefaults(
  defineProps<{ site: SiteSelect, pageCount?: number, device: 'mobile' | 'desktop' }>(),
  {
    pageCount: 8,
  },
)

const page = ref(1)

const deviceKey = computed(() => props.device === 'mobile' ? 'psiMobile' : 'psiDesktop')

const columns = computed(() => [
  {
    key: 'page',
    label: 'Page',
    sortable: true,
  },
  {
    key: `${deviceKey.value}Performance`,
    label: 'Score',
    sortable: true,
  },
  {
    key: `${deviceKey.value}Lcp`,
    label: 'Largest Contentful Paint',
    sortable: true,
  },
  {
    key: `${deviceKey.value}Si`,
    label: 'Speed Index',
    sortable: true,
  },
  {
    key: `${deviceKey.value}Tbt`,
    label: 'Total Blocking Time',
    sortable: true,
  },
  {
    key: `${deviceKey.value}Cls`,
    label: 'Cumulative Layout Shift',
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
  <TableAsyncData :path="`/api/sites/${site.siteId}/psi-performance`" :columns="columns" :filters="filters" expandable @page-change="p => page = p" @update:expanded="updateExpandedData">
    <template #page-data="{ row, expanded }">
      <div class="flex items-center">
        <div class="relative group w-[260px] max-w-full">
          <div class="flex items-center gap-2">
            <button type="button" :title="`Open ${row.path}`" class="max-w-[260px] text-xs">
              <div class="max-w-[260px] truncate text-ellipsis">
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
    <template #psiMobilePerformance-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiMobilePerformance}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanFriendlyNumber(row.psiMobilePerformance) }}
        </UTooltip>
      </div>
    </template>
    <template #psiDesktopPerformance-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiDesktopPerformance}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanFriendlyNumber(row.psiDesktopPerformance) }}
        </UTooltip>
      </div>
    </template>
    <template #psiMobileLcp-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiMobileLcp}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanMs(row.psiMobileLcp) }}
        </UTooltip>
      </div>
    </template>
    <template #psiDesktopLcp-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiDesktopLcp}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanMs(row.psiDesktopLcp) }}
        </UTooltip>
      </div>
    </template>
    <template #psiMobileSi-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiMobileSi}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanMs(row.psiMobileSi) }}
        </UTooltip>
      </div>
    </template>
    <template #psiDesktopSi-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiDesktopSi}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanMs(row.psiDesktopSi) }}
        </UTooltip>
      </div>
    </template>
    <template #psiMobileTbt-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiMobileTbt}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanMs(row.psiMobileTbt) }}
        </UTooltip>
      </div>
    </template>
    <template #psiDesktopTbt-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiDesktopTbt}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanMs(row.psiDesktopTbt) }}
        </UTooltip>
      </div>
    </template>
    <template #psiMobileCls-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiMobileCls}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanFriendlyNumber(row.psiMobileCls) }}
        </UTooltip>
      </div>
    </template>
    <template #psiDesktopCls-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiDesktopCls}ms this period`" class="flex items-center justify-center gap-1">
          {{ useHumanFriendlyNumber(row.psiDesktopCls) }}
        </UTooltip>
      </div>
    </template>
    <template #actions-data="{ row }">
      <UDropdown :items="[[{ label: 'Open Page', click: () => openUrl(row.path, '_blank') }], [{ label: 'Page Inspections', icon: 'i-heroicons-document-magnifying-glass', disabled: true }, (row.inspectionResult?.inspectionResultLink ? { label: 'View Inspection Result' } : undefined), { label: 'Inspect Index Status' }].filter(Boolean)]">
        <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
      </UDropdown>
    </template>
  </TableAsyncData>
</template>

<script setup lang="ts">
import type { GscDataRow } from '~/types/data'
import { callFnSyncToggleRef } from '~/composables/loader'
import type { SiteSelect } from '~/server/database/schema'
import { formatPageSpeedInsightScore } from '~/composables/formatting'
import type { TableAsyncDataProps } from '~/components/Table/TableAsyncData.vue'

const props = withDefaults(
  defineProps<{
    site: SiteSelect
    sortable?: boolean
    excludeColumns?: string[]
    device: 'mobile' | 'desktop'
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

const deviceKey = computed(() => props.device === 'mobile' ? 'mobile' : 'desktop')

const columns = computed(() => [
  {
    key: 'page',
    label: 'Page',
    sortable: props.sortable,
  },
  {
    key: `${deviceKey.value}Lcp75`,
    label: 'LCP',
    sortable: props.sortable,
  },
  {
    key: `${deviceKey.value}Inp75`,
    label: 'INP',
    sortable: props.sortable,
  },
  {
    key: `${deviceKey.value}Cls75`,
    label: 'CLS',
    sortable: props.sortable,
  },
  {
    key: `${deviceKey.value}Fcp75`,
    label: 'FCP',
    sortable: props.sortable,
  },
  {
    key: `${deviceKey.value}Ttfb75`,
    label: 'TTFB',
    sortable: props.sortable,
  },
  {
    key: 'actions',
  },
].filter(Boolean).filter((col) => {
  return !(props.excludeColumns || []).includes(col.key)
}))

const filters = computed(() => {
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
  <TableAsyncData v-bind="$props" :path="`/api/sites/${site.siteId}/crux-performance`" :columns="columns" :filters="filters" :expandable="expandable" @page-change="p => page = p" @update:expanded="updateExpandedData">
    <template #page-data="{ row, expanded }">
      <div class="flex items-center">
        <div class="relative group w-[260px] max-w-full">
          <div class="flex items-center gap-2 mb-1">
            <button type="button" :title="`Open ${row.path}`" class="max-w-[260px] text-xs">
              <div class="text-black max-w-[260px] truncate text-ellipsis">
                {{ pageUrlToPath(row.path) }}
              </div>
            </button>
          </div>
          <!--          <UProgress :value="row[`${deviceKey}Performance`]" :color="psiScoreToColor(row[`${deviceKey}Performance`])" class="opacity-50" size="xs" v-bind="$attrs" /> -->
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
        <UTooltip :text="`${row.psiMobilePerformance}ms this period`" class="font-bold flex items-center justify-center gap-1" :class="formatPageSpeedInsightScore(row.psiMobilePerformance)">
          {{ useHumanFriendlyNumber(row.psiMobilePerformance) }}
        </UTooltip>
      </div>
    </template>
    <template #psiDesktopPerformance-data="{ row }">
      <div class="flex gap-3 items-center">
        <UTooltip :text="`${row.psiDesktopPerformance}ms this period`" class="font-bold flex items-center justify-center gap-1" :class="formatPageSpeedInsightScore(row.psiDesktopPerformance)">
          {{ useHumanFriendlyNumber(row.psiDesktopPerformance) }}
        </UTooltip>
      </div>
    </template>
    <template #mobileFcp75-data="{ row }">
      <PsiUnit :value="row.mobileFcp75" class="mb-1" />
      <PsiBenchmark :value="row.mobileFcp75" :fast="1800" :moderate="3000" />
    </template>
    <template #psiDesktopFcp-data="{ row }">
      <PsiUnit :value="row.psiDesktopFcp" class="mb-1" />
      <PsiBenchmark :value="row.psiDesktopFcp" :fast="1800" :moderate="3000" />
    </template>
    <template #mobileLcp75-data="{ row }">
      <PsiUnit :value="row.mobileLcp75" class="mb-1" />
      <PsiBenchmark :value="row.mobileLcp75" :fast="2500" :moderate="4000" />
    </template>
    <template #psiDesktopLcp-data="{ row }">
      <PsiUnit :value="row.psiDesktopLcp" class="mb-1" />
      <PsiBenchmark :value="row.psiDesktopLcp" :fast="2500" :moderate="4000" />
    </template>
    <template #psiMobileSi-data="{ row }">
      <PsiUnit :value="row.psiMobileSi" class="mb-1" />
      <PsiBenchmark :value="row.psiMobileSi" :fast="3400" :moderate="5800" />
    </template>
    <template #psiDesktopSi-data="{ row }">
      <PsiUnit :value="row.psiDesktopSi" class="mb-1" />
      <PsiBenchmark :value="row.psiDesktopSi" :fast="3400" :moderate="5800" />
    </template>
    <template #mobileTtfb75-data="{ row }">
      <PsiUnit :value="row.mobileTtfb75" class="mb-1" />
      <PsiBenchmark :value="row.mobileTtfb75" :fast="800" :moderate="1800" />
    </template>
    <template #psiDesktopTbt-data="{ row }">
      <PsiUnit :value="row.psiDesktopTbt" class="mb-1" />
      <PsiBenchmark :value="row.psiDesktopTbt" :fast="800" :moderate="1800" />
    </template>
    <template #psiMobileCls-data="{ row }">
      <PsiUnit :value="row.psiMobileCls" unitless class="mb-1" />
      <PsiBenchmark :value="row.psiMobileCls" :fast="0.1" :moderate="0.25" />
    </template>
    <template #psiDesktopCls-data="{ row }">
      <div>
        <PsiUnit :value="row.psiDesktopCls" unitless class="mb-1" />
        <PsiBenchmark :value="row.psiDesktopCls" :fast="0.1" :moderate="0.25" />
      </div>
    </template>
    <template #actions-data="{ row }">
      <UDropdown :items="[[{ label: 'Open Page', click: () => openUrl(row.path, '_blank') }], [{ label: 'Page Inspections', icon: 'i-heroicons-document-magnifying-glass', disabled: true }, (row.inspectionResult?.inspectionResultLink ? { label: 'View Inspection Result' } : undefined), { label: 'Inspect Index Status' }].filter(Boolean)]">
        <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
      </UDropdown>
    </template>
  </TableAsyncData>
</template>

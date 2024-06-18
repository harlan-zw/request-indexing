<script setup lang="ts">
import type { GscDataRow } from '~/types/data'
import { callFnSyncToggleRef } from '~/composables/loader'
import type { SiteSelect } from '~/server/database/schema'
import type {TableAsyncDataProps} from "~/components/Table/TableAsyncData.vue";

const props = withDefaults(
  defineProps<{
    site: SiteSelect
    sortable?: boolean
    excludeColumns?: string[]
    device?: 'mobile' | 'desktop'
  } & TableAsyncDataProps>(),
  {
    device: 'mobile',
    searchable: true,
    sortable: true,
    pagination: true,
    expandable: true,
    pageSize: 8,
  },
)

const key = computed(() => `psi${props.device === 'mobile' ? 'Mobile' : 'Desktop'}`)

const page = ref(1)

const columns = computed(() => [
  {
    key: 'page',
    label: 'Page',
    sortable: props.sortable,
  },
  {
    key: `${key.value}Performance`,
    label: 'Performance',
    sortable: props.sortable,
  },
  // {
  //   key: 'clicksPercent',
  //   label: '%',
  //   sortable: true,
  // },
  {
    key: `${key.value}Accessibility`,
    label: 'Accessibility',
    sortable: props.sortable,
  },
  // {
  //   key: 'clicksPercent',
  //   label: '%',
  //   sortable: true,
  // },
  {
    key: `${key.value}BestPractices`,
    label: 'Best Practices',
    sortable: props.sortable,
  },
  // {
  //   key: 'impressionsPercent',
  //   label: '%',
  //   sortable: true,
  // },
  {
    key: `${key.value}Seo`,
    label: 'SEO',
    sortable: props.sortable,
  },
  // {
  //   key: 'impressionsPercent',
  //   label: '%',
  //   sortable: true,
  // },
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
  <div>
    <TableAsyncData :path="`/api/sites/${site.siteId}/psi`" :columns="columns" :filters="filters" expandable @page-change="p => page = p" @update:expanded="updateExpandedData">
      <template #page-data="{ row, expanded }">
        <div class="flex items-center">
          <div class="relative group w-[260px] max-w-full">
            <div class="flex items-center gap-2">
              <button type="button" :title="`Open ${row.path}`" class="max-w-[260px] text-xs">
                <div class="text-black max-w-[260px] truncate text-ellipsis">
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
  </div>
</template>

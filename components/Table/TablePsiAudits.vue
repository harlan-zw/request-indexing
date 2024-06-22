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
    label: 'Pages',
    sortable: props.sortable,
  },
  {
    key: 'score',
    label: 'Avg. Score',
    sortable: props.sortable,
  },
  {
    key: 'category',
    label: 'Category',
    sortable: props.sortable,
  },
  {
    key: 'weight',
    label: 'Weight',
    sortable: props.sortable,
  },
  // {
  //   key: 'path',
  //   label: 'Paths',
  //   sortable: props.sortable,
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
<TableAsyncData :key="filter" :filter="filter" :sort="sort" :pagination="pagination" :searchable="searchable" :page-size="pageSize" :columns="columns" :filters="filters" :expandable="expandable" :path="`/api/sites/${site.siteId}/psi-audits`" @page-change="p => page = p" @update:expanded="updateExpandedData">
  <template #category-data="{ row }">
  <div v-if="row.category === 'seo'" class="text-xs">SEO</div>
  <div v-else-if="row.category === 'best-practices'" class="text-xs">Best Practices</div>
  <div v-else class="text-xs capitalize">{{ row.category }}</div>
  </template>
  <template #auditId-data="{ row }">
  <div class="relative group w-[350px] max-w-full">
    <div class="flex items-center gap-2">
      <button type="button" :title="`Open ${row.path}`" class="max-w-[350px] text-xs">
        <div class="max-w-[350px] text-[11px] text-black dark:text-white truncate text-ellipsis">
          {{ audits[row.auditId].title }}
        </div>
      </button>
    </div>
  </div>
  </template>
  <template #count-data="{ row, expanded }">
  <div class="flex items-center">
    <UPopover mode="hover">
    <div class="mr-3 text-xs w-14">
      {{ row.count }}
    </div>
      <template #panel>
      <div class="flex items-center gap-2 p-3">
        <button type="button" :title="`Open ${row.path}`" class="max-w-[260px] text-xs">
          <div class="text-black dark:text-white max-w-[200px] text-xs truncate text-ellipsis">
            {{ pageUrlToPath(row.path) }}
          </div>
        </button>
      </div>
      </template>
    </UPopover>
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

<script lang="ts" setup>
const props = defineProps<{
  siteId: string
}>()

const { data, status } = useGscdumpSitemaps(() => props.siteId)

const columns = [
  { key: 'path', label: 'Sitemap' },
  { key: 'urlCount', label: 'URLs' },
  { key: 'errors', label: 'Errors' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'lastDownloaded', label: 'Last Downloaded' },
  { key: 'status', label: 'Status' },
]

const historyGraph = computed(() => {
  if (!data.value?.history?.length)
    return []
  return data.value.history.map(h => ({
    date: h.date,
    clicks: h.urlCount,
    impressions: h.errors,
    position: h.warnings,
  }))
})
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="flex items-center justify-center py-8">
      <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
    </div>
    <template v-else-if="data?.sitemaps?.length">
      <div v-if="historyGraph.length" class="mb-6">
        <div class="text-xs text-gray-500 mb-2">
          URL Count History
        </div>
        <GraphDataNext :height="100" :value="historyGraph" :columns="['clicks']" />
      </div>

      <UTable
        :rows="data.sitemaps"
        :columns="columns"
        :ui="{
          th: { padding: 'px-2 py-2', size: 'text-xs', font: 'font-normal' },
          td: { padding: 'px-2 py-1' },
        }"
      >
        <template #path-data="{ row }">
          <span class="text-xs text-blue-600 truncate max-w-[300px] block" :title="row.path">{{ row.path }}</span>
        </template>
        <template #urlCount-data="{ row }">
          <span class="text-xs font-mono text-right block">{{ useHumanFriendlyNumber(row.urlCount) }}</span>
        </template>
        <template #errors-data="{ row }">
          <UBadge v-if="row.errors > 0" color="red" variant="subtle" size="xs">
            {{ row.errors }}
          </UBadge>
          <span v-else class="text-xs text-gray-400">0</span>
        </template>
        <template #warnings-data="{ row }">
          <UBadge v-if="row.warnings > 0" color="yellow" variant="subtle" size="xs">
            {{ row.warnings }}
          </UBadge>
          <span v-else class="text-xs text-gray-400">0</span>
        </template>
        <template #lastDownloaded-data="{ row }">
          <span v-if="row.lastDownloaded" class="text-xs text-gray-500">{{ useTimeAgo(row.lastDownloaded) }}</span>
          <span v-else class="text-xs text-gray-400">-</span>
        </template>
        <template #status-data="{ row }">
          <UBadge v-if="row.isPending" color="yellow" variant="subtle" size="xs">
            Pending
          </UBadge>
          <UBadge v-else color="green" variant="subtle" size="xs">
            OK
          </UBadge>
        </template>
      </UTable>
    </template>
    <div v-else class="text-sm text-gray-500 py-4">
      No sitemaps found for this site.
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  siteId: string
}>()

const { data, status } = useGscdumpSitemaps(() => props.siteId)

// Nuxt UI v4 tables are TanStack-backed and need `accessorKey`/`header`; the v2
// `{ key, label }` shape produces column defs with no id. This table only
// escaped the resulting server-render crash because it sits behind a `v-if` on
// loaded data, so it never rendered during SSR.
const columns = [
  { accessorKey: 'path', header: 'Sitemap' },
  { accessorKey: 'urlCount', header: 'URLs' },
  { accessorKey: 'errors', header: 'Errors' },
  { accessorKey: 'warnings', header: 'Warnings' },
  { accessorKey: 'lastDownloaded', header: 'Last Downloaded' },
  { accessorKey: 'status', header: 'Status' },
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
        :data="data.sitemaps"
        :columns="columns"
        :ui="{
          th: 'px-2 py-2 text-xs font-normal',
          td: 'px-2 py-1',
        }"
      >
        <template #path-cell="{ row: r }">
          <span class="text-xs text-blue-600 truncate max-w-[300px] block" :title="r.original.path">{{ r.original.path }}</span>
        </template>
        <template #urlCount-cell="{ row: r }">
          <span class="text-xs font-mono text-right block">{{ useHumanFriendlyNumber(r.original.urlCount) }}</span>
        </template>
        <template #errors-cell="{ row: r }">
          <UBadge v-if="r.original.errors > 0" color="error" variant="subtle" size="xs">
            {{ r.original.errors }}
          </UBadge>
          <span v-else class="text-xs text-gray-400">0</span>
        </template>
        <template #warnings-cell="{ row: r }">
          <UBadge v-if="r.original.warnings > 0" color="warning" variant="subtle" size="xs">
            {{ r.original.warnings }}
          </UBadge>
          <span v-else class="text-xs text-gray-400">0</span>
        </template>
        <template #lastDownloaded-cell="{ row: r }">
          <span v-if="r.original.lastDownloaded" class="text-xs text-gray-500">{{ formatIndexingTimeAgo(r.original.lastDownloaded) }}</span>
          <span v-else class="text-xs text-gray-400">-</span>
        </template>
        <template #status-cell="{ row: r }">
          <UBadge v-if="r.original.isPending" color="warning" variant="subtle" size="xs">
            Pending
          </UBadge>
          <UBadge v-else color="success" variant="subtle" size="xs">
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

<script lang="ts" setup>
const props = defineProps<{
  siteId: string
}>()

const { data, status, error, refresh } = useGscdumpSitemaps(() => props.siteId)

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

const sitemaps = computed(() => data.value?.sitemaps ?? [])
const history = computed(() => data.value?.history ?? [])

// "URL Count History" drew a flat filled area with no axis, no values and no
// tooltip for a site with 21 URLs, so it carried no information at all. The
// numbers it was hiding are shown directly instead.
const totals = computed(() => {
  const urls = sitemaps.value.reduce((sum, sitemap) => sum + (sitemap.urlCount || 0), 0)
  const first = history.value[0]
  const last = history.value.at(-1)
  const change = first && last ? last.urlCount - first.urlCount : null
  return {
    urls,
    sitemaps: sitemaps.value.length,
    errors: sitemaps.value.reduce((sum, sitemap) => sum + (sitemap.errors || 0), 0),
    warnings: sitemaps.value.reduce((sum, sitemap) => sum + (sitemap.warnings || 0), 0),
    change,
    days: history.value.length,
  }
})
</script>

<template>
  <AsyncCardState
    :status="status"
    :error="error"
    :empty="!sitemaps.length"
    label="sitemaps"
    empty-message="No sitemaps are submitted for this site."
    min-height="min-h-40"
    :rows="4"
    @retry="refresh()"
  >
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div>
        <div class="text-xs text-muted">
          URLs
        </div>
        <div class="font-mono text-xl font-semibold tabular-nums text-highlighted">
          {{ useHumanFriendlyNumber(totals.urls) }}
        </div>
        <div v-if="totals.change !== null && totals.days > 1" class="text-xs text-muted">
          {{ totals.change > 0 ? '+' : '' }}{{ totals.change }} over {{ totals.days }} days
        </div>
      </div>
      <div>
        <div class="text-xs text-muted">
          Sitemaps
        </div>
        <div class="font-mono text-xl font-semibold tabular-nums text-highlighted">
          {{ totals.sitemaps }}
        </div>
      </div>
      <div>
        <div class="text-xs text-muted">
          Errors
        </div>
        <div class="font-mono text-xl font-semibold tabular-nums" :class="totals.errors ? 'text-error' : 'text-highlighted'">
          {{ totals.errors }}
        </div>
      </div>
      <div>
        <div class="text-xs text-muted">
          Warnings
        </div>
        <div class="font-mono text-xl font-semibold tabular-nums" :class="totals.warnings ? 'text-warning' : 'text-highlighted'">
          {{ totals.warnings }}
        </div>
      </div>
    </div>

    <UTable
      :data="sitemaps"
      :columns="columns"
      :ui="{
        th: 'px-2 py-2 text-xs font-normal',
        td: 'px-2 py-1',
      }"
    >
      <template #path-cell="{ row: r }">
        <span class="block max-w-[300px] truncate text-xs text-default" :title="r.original.path">{{ r.original.path }}</span>
      </template>
      <template #urlCount-cell="{ row: r }">
        <span class="text-xs font-mono tabular-nums text-right block">{{ useHumanFriendlyNumber(r.original.urlCount) }}</span>
      </template>
      <template #errors-cell="{ row: r }">
        <UBadge :color="r.original.errors > 0 ? 'error' : 'neutral'" variant="subtle" size="sm">
          {{ r.original.errors }}
        </UBadge>
      </template>
      <template #warnings-cell="{ row: r }">
        <UBadge :color="r.original.warnings > 0 ? 'warning' : 'neutral'" variant="subtle" size="sm">
          {{ r.original.warnings }}
        </UBadge>
      </template>
      <template #lastDownloaded-cell="{ row: r }">
        <span v-if="r.original.lastDownloaded" class="text-xs text-muted">{{ formatIndexingTimeAgo(r.original.lastDownloaded) }}</span>
        <span v-else class="text-xs text-dimmed">Never</span>
      </template>
      <template #status-cell="{ row: r }">
        <UBadge v-if="r.original.isPending" color="warning" variant="subtle" size="sm" icon="i-lucide-clock">
          Pending
        </UBadge>
        <UBadge v-else color="success" variant="subtle" size="sm" icon="i-lucide-check">
          OK
        </UBadge>
      </template>
    </UTable>
  </AsyncCardState>
</template>

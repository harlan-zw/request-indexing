<script lang="ts" setup>
const props = defineProps<{
  siteId: string
}>()

const statusTab = ref<'indexed' | 'not_indexed' | 'pending'>('indexed')
const search = ref('')
const page = ref(1)
const pageSize = 20

const params = computed(() => ({
  limit: pageSize,
  offset: (page.value - 1) * pageSize,
  status: statusTab.value,
  search: search.value || undefined,
}))

const { data, status, error, refresh } = useGscdumpIndexingUrls(
  () => props.siteId,
  params,
)

const urls = computed(() => data.value?.urls ?? [])

const emptyMessage = computed(() => {
  if (search.value)
    return `No ${statusTab.value.replace('_', ' ')} URLs match "${search.value}".`
  return `No ${statusTab.value.replace('_', ' ')} URLs for this site.`
})

const nextStep = computed(() => {
  if (search.value)
    return 'Clear the search to see every URL in this state.'
  if (statusTab.value === 'indexed')
    return 'Submit a sitemap in Search Console, then check back after the next sync.'
  if (statusTab.value === 'pending')
    return 'Every inspected URL has a verdict.'
  return 'Nothing needs attention in this state.'
})

watch(statusTab, () => {
  page.value = 1
})
watch(search, () => {
  page.value = 1
})

// Nuxt UI v4 colors are semantic tokens; 'green'/'red'/'yellow'/'gray' are v2
// names that the types reject and the runtime ignores.
type BadgeColor = 'success' | 'error' | 'warning' | 'neutral'

const tabs = [
  { key: 'indexed' as const, label: 'Indexed', color: 'success' as BadgeColor },
  { key: 'not_indexed' as const, label: 'Not Indexed', color: 'error' as BadgeColor },
  { key: 'pending' as const, label: 'Pending', color: 'warning' as BadgeColor },
]

// Nuxt UI v4 tables are TanStack-backed: `{ key, label }` yields column defs
// with no id and throws while building header groups, which 500'd this route
// during server rendering.
const columns = [
  { accessorKey: 'url', header: 'URL' },
  { accessorKey: 'verdict', header: 'Verdict' },
  { accessorKey: 'coverageState', header: 'Coverage' },
  { accessorKey: 'lastCrawlTime', header: 'Last Crawl' },
]

const verdictColor: Record<string, BadgeColor> = {
  PASS: 'success',
  FAIL: 'error',
  PARTIAL: 'warning',
  NEUTRAL: 'neutral',
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-3 mb-4">
      <!-- The three states were plain text with a pale pill on the active one,
           so the row did not read as a control at all. -->
      <div class="inline-flex rounded-lg border border-default p-0.5" role="tablist">
        <UButton
          v-for="t in tabs"
          :key="t.key"
          size="xs"
          role="tab"
          :aria-selected="statusTab === t.key"
          :color="statusTab === t.key ? t.color : 'neutral'"
          :variant="statusTab === t.key ? 'subtle' : 'ghost'"
          class="min-h-8"
          @click="statusTab = t.key"
        >
          {{ t.label }}
        </UButton>
      </div>
      <div class="flex w-[200px] ml-auto">
        <UInput
          v-model="search"
          class="w-full"
          placeholder="Search URLs..."
          icon="i-heroicons-magnifying-glass"
          autocomplete="off"
          size="xs"
        />
      </div>
    </div>

    <AsyncCardState
      :status="status"
      :error="error"
      :empty="!urls.length"
      label="URL list"
      :empty-message="emptyMessage"
      min-height="min-h-40"
      :rows="5"
      @retry="refresh()"
    >
      <!-- "No data" with no next step left the reader stuck. -->
      <template #empty>
        <UIcon name="i-lucide-inbox" class="size-6 text-dimmed" />
        <div>
          <p class="font-medium text-highlighted">
            Nothing to show
          </p>
          <p class="text-sm text-muted">
            {{ emptyMessage }} {{ nextStep }}
          </p>
        </div>
        <UButton v-if="search" label="Clear search" color="neutral" variant="outline" size="sm" class="min-h-10" @click="search = ''" />
      </template>
      <UTable
        :data="urls"
        :columns="columns"
        :ui="{
          th: 'px-2 py-2 text-xs font-normal',
          td: 'px-2 py-1',
        }"
      >
        <template #url-cell="{ row: r }">
          <span class="block max-w-[400px] truncate text-xs text-default" :title="r.original.url">{{ r.original.url }}</span>
        </template>
        <template #verdict-cell="{ row: r }">
          <UBadge :color="verdictColor[r.original.verdict ?? ''] ?? 'neutral'" variant="subtle" size="xs">
            {{ r.original.verdict }}
          </UBadge>
        </template>
        <template #coverageState-cell="{ row: r }">
          <span class="text-xs text-toned">{{ r.original.coverageState }}</span>
        </template>
        <template #lastCrawlTime-cell="{ row: r }">
          <span v-if="r.original.lastCrawlTime" class="text-xs text-muted">{{ formatIndexingTimeAgo(r.original.lastCrawlTime) }}</span>
          <span v-else class="text-xs text-dimmed">Never</span>
        </template>
      </UTable>
    </AsyncCardState>

    <div v-if="data?.pagination && data.pagination.total > pageSize" class="flex items-center gap-3 pt-3">
      <UPagination
        v-model:page="page"
        :items-per-page="pageSize"
        size="xs"
        variant="link"
        :max="5"
        :total="data.pagination.total"
      />
    </div>
  </div>
</template>

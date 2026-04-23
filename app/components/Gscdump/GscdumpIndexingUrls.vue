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

const { data, status } = useGscdumpIndexingUrls(
  () => props.siteId,
  params,
)

watch(statusTab, () => { page.value = 1 })
watch(search, () => { page.value = 1 })

const tabs = [
  { key: 'indexed' as const, label: 'Indexed', color: 'green' },
  { key: 'not_indexed' as const, label: 'Not Indexed', color: 'red' },
  { key: 'pending' as const, label: 'Pending', color: 'yellow' },
]

const columns = [
  { key: 'url', label: 'URL' },
  { key: 'verdict', label: 'Verdict' },
  { key: 'coverageState', label: 'Coverage' },
  { key: 'lastCrawlTime', label: 'Last Crawl' },
]

const verdictColor: Record<string, string> = {
  PASS: 'green',
  FAIL: 'red',
  PARTIAL: 'yellow',
  NEUTRAL: 'gray',
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 mb-4">
      <UButton
        v-for="t in tabs"
        :key="t.key"
        size="xs"
        :color="statusTab === t.key ? t.color : 'neutral'"
        :variant="statusTab === t.key ? 'soft' : 'ghost'"
        @click="statusTab = t.key"
      >
        {{ t.label }}
      </UButton>
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

    <UTable
      :loading="status === 'pending'"
      :rows="data?.urls || []"
      :columns="columns"
      :ui="{
        th: { padding: 'px-2 py-2', size: 'text-xs', font: 'font-normal' },
        td: { padding: 'px-2 py-1' },
      }"
    >
      <template #url-data="{ row }">
        <span class="text-xs text-blue-600 truncate max-w-[400px] block" :title="row.url">{{ row.url }}</span>
      </template>
      <template #verdict-data="{ row }">
        <UBadge :color="verdictColor[row.verdict] || 'gray'" variant="subtle" size="xs">
          {{ row.verdict }}
        </UBadge>
      </template>
      <template #coverageState-data="{ row }">
        <span class="text-xs text-gray-600">{{ row.coverageState }}</span>
      </template>
      <template #lastCrawlTime-data="{ row }">
        <span v-if="row.lastCrawlTime" class="text-xs text-gray-500">{{ useTimeAgo(row.lastCrawlTime) }}</span>
        <span v-else class="text-xs text-gray-400">-</span>
      </template>
    </UTable>

    <div v-if="data?.pagination && data.pagination.total > pageSize" class="flex items-center gap-3 pt-3">
      <UPagination
        v-model="page"
        :inactive-button="{ variant: 'link' }"
        :active-button="{ color: 'blue', variant: 'link', class: 'underline' }"
        :prev-button="false"
        :next-button="{ variant: 'link' }"
        size="xs"
        :page-count="pageSize"
        :max="5"
        :total="data.pagination.total"
      />
    </div>
  </div>
</template>

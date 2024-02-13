<script setup lang="ts">
import { joinURL } from 'ufo'
import type { IndexedUrl } from '~/types/data'

const props = withDefaults(
  defineProps<{ mock?: boolean, value?: IndexedUrl[], siteUrl: string, pending?: boolean, pageCount?: number }>(),
  {
    pageCount: 12,
  },
)

type IndexedUrlRow = IndexedUrl

const q = ref('')
const page = ref(1)

const rows = computed<IndexedUrlRow[]>(() => props.value || [])

const queriedRows = computed<IndexedUrlRow[]>(() => {
  if (!q.value)
    return rows.value
  return rows.value.filter((row) => {
    return Object.values(row).some((value) => {
      return String(value).toLowerCase().includes(q.value.toLowerCase())
    })
  })
})

const paginatedRows = computed<IndexedUrlRow[]>(() => {
  return queriedRows.value.slice((page.value - 1) * props.pageCount, (page.value) * props.pageCount)
})

const columns = [
  {
    key: 'url',
    label: 'URL',
    sortable: true,
  },
  {
    key: 'clicks',
    label: 'Clicks',
    sortable: true,
  },
  {
    key: 'clicksPercent',
    label: '%',
    sortable: true,
  },
  {
    key: 'impressions',
    label: 'Impressions',
    sortable: true,
  },
  {
    key: 'impressionsPercent',
    label: '%',
    sortable: true,
  },
  {
    key: 'actions',
  },
]

const siteUrlFriendly = useFriendlySiteUrl(props.siteUrl)

const highestRowClickCount = computed(() => {
  return Math.max(...rows.value.map(row => row.clicks!))
})

function openUrl(url: string, target?: string) {
  window.open(url, target)
}
</script>

<template>
  <div>
    <div v-if="!mock" class=" ">
      <div class="flex items-center gap-5 mb-5">
        <div class="flex w-1/2 dark:border-gray-700">
          <UInput v-model="q" placeholder="Search" class="w-full" />
        </div>
      </div>
      <UDivider />
    </div>
    <UTable :loading="!value" :rows="paginatedRows" :columns="columns">
      <template #url-data="{ row }">
        <div class="relative group">
          <UButton :title="row.url" variant="link" class="w-full" size="xs" :class="mock ? ['pointer-events-none'] : []" :to="joinURL(`https://${siteUrlFriendly}`, row.url)" target="_blank" color="gray">
            <div class="max-w-[300px] truncate text-ellipsis">
              {{ row.url }}
            </div>
          </UButton>
          <UProgress :value="Math.round((row.clicks / highestRowClickCount) * 100)" color="blue" size="xs" class="ml-2 opacity-75 group-hover:opacity-100 transition mt-1" />
        </div>
      </template>
      <template #clicks-data="{ row }">
        <div class="text-center">
          {{ useHumanFriendlyNumber(row.clicks) }}
        </div>
      </template>
      <template #clicksPercent-data="{ row }">
        <TrendPercentage :value="row.clicks" :prev-value="row.prevClicks" />
      </template>
      <template #impressions-data="{ row }">
        <div class="text-center">
          {{ useHumanFriendlyNumber(row.impressions) }}
        </div>
      </template>
      <template #impressionsPercent-data="{ row }">
        <TrendPercentage :value="row.impressions" :prev-value="row.prevImpressions" />
      </template>
      <template #actions-data="{ row }">
        <UDropdown :items="[[{ label: 'Open URL', click: () => openUrl(row.url, '_blank'), badge: { label: 'soon' } }]]">
          <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
        </UDropdown>
      </template>
    </UTable>
    <div class="flex items-center justify-between mt-7 px-3 py-5 border-t  border-gray-200 dark:border-gray-700">
      <UPagination v-model="page" :page-count="pageCount" :total="queriedRows.length" />
      <div class="text-base dark:text-gray-300 text-gray-600 mb-2">
        {{ queriedRows.length }} total
      </div>
    </div>
  </div>
</template>

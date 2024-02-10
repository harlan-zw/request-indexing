<script setup lang="ts">
import { joinURL } from 'ufo'
import type { IndexedUrl } from '~/types/data'

const props = defineProps<{ value?: IndexedUrl[], siteUrl: string, pending: boolean }>()

type IndexedUrlRow = IndexedUrl

const q = ref('')
const page = ref(1)
const pageCount = 12

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
  return queriedRows.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
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
]

const siteUrlFriendly = useFriendlySiteUrl(props.siteUrl)

const highestRowClickCount = computed(() => {
  return Math.max(...rows.value.map(row => row.clicks!))
})
</script>

<template>
  <div>
    <div class="flex px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
      <UInput v-model="q" placeholder="Search" />
    </div>
    <UTable :loading="!value" :rows="paginatedRows" :columns="columns">
      <template #url-data="{ row }">
        <div class="relative w-[300px] truncate text-ellipsis">
          <NuxtLink :to="joinURL(`https://${siteUrlFriendly}`, row.url)" target="_blank" class="text-gray-900 z-2 relative  text-ellipsis underline">
            {{ row.url }}
          </NuxtLink>
          <UProgress :value="Math.round((row.clicks / highestRowClickCount) * 100)" color="blue" size="xs" class="opacity-50 mt-1" />
        </div>
      </template>
      <template #clicks-data="{ row }">
        <div class="text-center">
          {{ useHumanFriendlyNumber(row.clicks) }}
        </div>
      </template>
      <template #clicksPercent-data="{ row }">
        <TrendPercentage :value="row.clicksPercent" />
      </template>
      <template #impressions-data="{ row }">
        <div class="text-center">
          {{ useHumanFriendlyNumber(row.impressions) }}
        </div>
      </template>
      <template #impressionsPercent-data="{ row }">
        <TrendPercentage :value="row.impressionsPercent" />
      </template>
    </UTable>
    <div class="flex items-center justify-between">
      <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
        <UPagination v-model="page" :page-count="pageCount" :total="queriedRows.length" />
      </div>
      <div class="text-lg dark:text-gray-300 text-gray-600 mb-2">
        {{ queriedRows.length }} total
      </div>
    </div>
  </div>
</template>

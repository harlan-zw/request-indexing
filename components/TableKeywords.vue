<script setup lang="ts">
const props = defineProps<{ value: KeywordList }>()

type KeywordList = { keyword: string }[]

const q = ref('')
const page = ref(1)
const pageCount = 12

const rows = computed<KeywordList[]>(() => props.value || [])

const queriedRows = computed<KeywordList[]>(() => {
  if (!q.value)
    return rows.value
  return rows.value.filter((row) => {
    return Object.values(row).some((value) => {
      return String(value).toLowerCase().includes(q.value.toLowerCase())
    })
  })
})

const paginatedRows = computed<KeywordList[]>(() => {
  return queriedRows.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
})

const columns = [{
  key: 'keyword',
  label: 'Keyword',
  sortable: true,
}, {
  key: 'position',
  label: 'Position',
  sortable: true,
}, {
  key: 'positionPercent',
  label: '%',
  sortable: true,
}, {
  key: 'ctr',
  label: 'CTR',
  sortable: true,
}, {
  key: 'ctrPercent',
  label: '%',
  sortable: true,
}]

const highestRowClickCount = computed(() => {
  return Math.max(...rows.value.map(row => row.clicks!))
})
</script>

<template>
  <div>
    <div class="flex px-3 py-3.5 border-b border-gray-200 dark:border-gray-700">
      <UInput v-model="q" placeholder="Search" class="w-full" />
    </div>
    <UTable :loading="!rows.length" :columns="columns" :rows="paginatedRows">
      <template #keyword-data="{ row }">
        <div class="relative w-[300px] truncate text-ellipsis">
          <div class="text-gray-900 z-2 relative  text-ellipsis underline">
            {{ row.keyword }}
          </div>
          <UProgress :value="Math.round((row.clicks / highestRowClickCount) * 100)" color="blue" size="xs" class="opacity-50 mt-1" />
        </div>
      </template>
      <template #position-data="{ row }">
        <div class="text-center">
          {{ useHumanFriendlyNumber(row.position) }}
        </div>
      </template>
      <template #positionPercent-data="{ row }">
        <TrendPercentage :value="row.positionPercent" />
      </template>
      <template #ctr-data="{ row }">
        <div class="text-center">
          {{ useHumanFriendlyNumber(row.ctr * 100) }}%
        </div>
      </template>
      <template #ctrPercent-data="{ row }">
        <TrendPercentage :value="row.ctrPercent" />
      </template>
    </UTable>
    <div v-if="rows.length > pageCount" class="flex items-center justify-between">
      <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700">
        <UPagination v-model="page" :page-count="pageCount" :total="queriedRows.length" />
      </div>
      <div class="text-lg dark:text-gray-300 text-gray-600 mb-2">
        {{ queriedRows.length }} total
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ mock?: boolean, value: KeywordList, pageCount?: number }>(),
  {
    pageCount: 12,
  },
)

type KeywordList = { keyword: string }[]

const q = ref('')
const page = ref(1)

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
  return queriedRows.value.slice((page.value - 1) * props.pageCount, (page.value) * props.pageCount)
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
    <div v-if="!mock" class=" ">
      <div class="flex items-center gap-5 mb-5">
        <div class="flex w-1/2 dark:border-gray-700">
          <UInput v-model="q" placeholder="Search" class="w-full" />
        </div>
      </div>
      <UDivider />
    </div>
    <UTable :loading="!rows.length" :columns="columns" :rows="paginatedRows">
      <template #keyword-data="{ row }">
        <div class="relative w-[300px] truncate text-ellipsis">
          <div class="block dark:text-gray-200 text-gray-900 z-2 truncate w-full">
            {{ row.keyword }}
          </div>
          <UProgress :value="Math.round((row.clicks / highestRowClickCount) * 100)" color="blue" size="xs" class="opacity-75 mt-1" />
        </div>
      </template>
      <template #position-data="{ row }">
        <div class="text-center">
          {{ useHumanFriendlyNumber(row.position) }}
        </div>
      </template>
      <template #positionPercent-data="{ row }">
        <TrendPercentage :value="row.position" :prev-value="row.prevPosition" />
      </template>
      <template #ctr-data="{ row }">
        <div class="text-center">
          {{ useHumanFriendlyNumber(row.ctr * 100) }}%
        </div>
      </template>
      <template #ctrPercent-data="{ row }">
        <TrendPercentage :value="row.ctr" :prev-value="row.prevCtr" />
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

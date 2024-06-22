<script lang="ts" setup generic="T extends Record<string, any>">
import { useUrlSearchParams } from '@vueuse/core'

export interface TableAsyncDataProps {
  filter?: string
  expandable?: boolean
  searchable?: boolean
  pageSize?: number
  pagination?: boolean
  sort?: { column: string, direction: 'asc' | 'desc' }
  filters?: { key: string, label: string, filter: (rows: T[]) => T[] }[]
}

const props = withDefaults(defineProps<{
  path: string
  columns: any[]
} & TableAsyncDataProps>(), {
  pageSize: 10,
  pagination: true,
  searchable: true,
})

const emit = defineEmits<{
  'totals': [totals: any]
  'update:expanded': [id: number]
  'pageChange': [page: number]
}>()

const value = ref<T[]>([])

const sort = ref({
  column: props.sort?.column,
  direction: props.sort?.direction,
})

const params = useUrlSearchParams('history', {
  removeNullishValues: true,
  removeFalsyValues: false,
})

// const sort = ref()
const q = ref(params.q || '')
const page = ref(params.page || 1)
const filter = ref(params.filter || props.filter || 'default')
const rows = computed<T>(() => value.value?.rows || [])
const expandedRow = ref(null)
const isLoading = ref(true)

const dataProvider = inject('tableAsyncDataProvider', null)
async function refresh() {
  isLoading.value = true
  const _filter = [
    filter.value,
    props.filter,
  ]
    .filter(Boolean)
    .filter(v => v !== 'default')
    .join(',')
  value.value = await $fetch(props.path, {
    query: {
      q: q.value,
      page: page.value,
      filter: _filter,
      sort: sort.value,
      pageSize: props.pageSize,
    },
  }).finally(() => {
    isLoading.value = false
  })
  if (dataProvider) {
    dataProvider.value = value.value
  }
}

onMounted(() => {
  refresh()
})

function toggleExpandedRow(index: number) {
  if (expandedRow.value === index)
    expandedRow.value = null
  else
    expandedRow.value = index
}

watch([q, filter, page, sort], () => {
  expandedRow.value = null
  refresh()
})

const filters = computed(() => {
  return [
    {
      key: 'default',
      label: 'Show all',
      filter: (rows: T[]) => {
        return rows
      },
    },
    ...props.filters || [],
  ].filter(Boolean)
})

function toggleFilter(_filter: string) {
  if (filter.value === _filter)
    filter.value = null
  else
    filter.value = _filter
}
// const paginatedRows = computed<T[]>(() => {
//   return queriedRows.value.slice((page.value - 1) * pageSize, (page.value) * pageSize)
// })

// function updateSort(_sort: any) {
//   if (_sort.column === null) {
//     sort.value = null
//     return
//   }
//   sort.value = {
//     column: _sort.column,
//     direction: _sort.direction,
//   }
// }

const columns = computed(() => {
  return [props.expandable ? { key: 'expand' } : null, ...props.columns].filter(Boolean).map(c => ({
    ...c,
    slotName: `${c.key}-data`,
    headerSlot: `${c.key}-header`,
  }))
})

watch(expandedRow, () => {
  emit('update:expanded', expandedRow.value ? paginatedRows.value[expandedRow.value] : null)
})

const tableUi = {
  default: {
    sortButton: {
      size: 'xs',
    },
  },
  th: {
    padding: 'px-2 py-2',
    size: 'text-xs',
    font: 'font-normal',
  },
  td: {
    padding: 'px-2 py-1',
  },
}
</script>

<template>
  <div>
    <template v-if="searchable || $slots.header">
      <div class="flex justify-between">
        <slot name="header" />
        <div v-if="searchable" class="flex items-center gap-5 mb-2">
          <div class="flex w-[200px] dark:border-gray-700">
            <UInput
              v-model="q"
              class="w-full"
              placeholder="Search..."
              icon="i-heroicons-magnifying-glass"
              autocomplete="off"
              size="xs"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UButton
                  v-show="q !== ''"
                  color="gray"
                  variant="link"
                  icon="i-heroicons-x-mark"
                  :padded="false"
                  @click="q = ''"
                />
              </template>
            </UInput>
          </div>
        </div>
        <div v-if="filters.length > 1" class="flex items-center gap-3 mb-3">
          <UBadge v-for="_filter in filters.filter(f => f.special)" :key="_filter.key" class="cursor-pointer" :ui="{ rounded: 'rounded-full' }" :color="filter === _filter.key ? 'green' : 'gray'" :variant="filter === _filter.key ? 'subtle' : 'soft'" @click="toggleFilter(_filter.key)">
            <UTooltip :text="_filter.description || ''" class="flex gap-1 items-center">
              <UIcon name="i-heroicons-sparkles" class="w-4 h-4" />
              {{ _filter.label }} <span v-if="_filter.key === filter" />
            </UTooltip>
          </UBadge>
          <UBadge v-for="_filter in filters.filter(f => !f.special)" :key="_filter.key" class="cursor-pointer" :ui="{ rounded: 'rounded-full' }" :color="filter === _filter.key ? 'green' : 'gray'" :variant="filter === _filter.key ? 'subtle' : 'soft'" @click="toggleFilter(_filter.key)">
            <UTooltip :text="_filter.description || ''" class="flex gap-1 items-center">
              {{ _filter.label }} <span v-if="_filter.key === filter" />
            </UTooltip>
          </UBadge>
        </div>
      </div>
      <UDivider />
    </template>
    <UTable v-model:sort="sort" sort-mode="manual" :loading="isLoading" :rows="rows" :columns="columns" :ui="tableUi">
      <template #expand-data="{ index }">
        <UButton :icon="expandedRow === index ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" color="gray" size="xs" variant="ghost" @click="toggleExpandedRow(index)" />
      </template>
      <!-- we need to re-implement the slots i think  -->
      <template v-for="column in columns.filter(c => c.key !== 'expand')" #[column.slotName]="data">
        <slot :name="column.slotName" v-bind="data" :value="value" :rows="rows" :expanded="expandedRow === data.index" />
      </template>
      <template v-for="column in columns.filter(c => c.key !== 'expand')" #[column.headerSlot]="data">
      <slot :name="column.headerSlot" v-bind="data" :value="value" :rows="rows" :expanded="expandedRow === data.index" />
      </template>
    </UTable>
    <div v-if="pagination && value?.total > pageSize" class="flex items-center  gap-3 pt-3">
<!--      <div class="text-sm dark:text-gray-300 text-gray-600">-->
<!--        {{ value?.total }} total-->
<!--      </div>-->
      <UPagination
        v-model="page"
        :inactiveButton="{ variant: 'link' }"
        :active-button="{ color: 'blue', variant: 'link', class: 'underline' }"
        :prev-button="false"
        :next-button="{ variant: 'link' }"
        size="xs"
        :page-count="pageSize"
        :max="5"
        :total="value?.total"
      />
    </div>
  </div>
</template>

<style>
th:first-child {
  padding-left: 0 !important;
}
td:first-child {
  padding-left: 0 !important;
}

th:last-child {
  padding-right: 0 !important;
}

td:last-child {
  padding-right: 0 !important;
}
</style>

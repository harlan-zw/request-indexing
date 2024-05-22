<script lang="ts" setup generic="T extends Record<string, any>">
import { useUrlSearchParams } from '@vueuse/core'
import { get } from '#ui/utils'

const props = withDefaults(defineProps<{
  value: T[]
  columns: any[]
  filters?: { key: string, label: string, filter: (rows: T[]) => T[] }[]
  expandable?: boolean
  searchable?: boolean
}>(), {
  searchable: true,
})

const emit = defineEmits<{
  'update:expanded': [id: number]
}>()

const params = useUrlSearchParams('history', {
  removeNullishValues: true,
  removeFalsyValues: false,
})

const sort = ref()
const q = ref(params.q || '')
const page = ref(params.page || 1)
const filter = ref(params.filter || 'default')
const rows = computed<T>(() => props.value || [])
const expandedRow = ref(null)

function toggleExpandedRow(index: number) {
  if (expandedRow.value === index)
    expandedRow.value = null
  else
    expandedRow.value = index
}

watch([q, filter, page, sort], () => {
  expandedRow.value = null
})

// order: sort, query, paginate

function defaultSort(a, b, direction) {
  if (a === b)
    return 0

  if (direction === 'asc')
    return a < b ? -1 : 1
  else
    return a > b ? -1 : 1
}

const sortedRows = computed(() => {
  if (!sort.value)
    return rows.value
  const { column, direction } = sort.value
  return rows.value.slice().sort((a, b) => {
    const aValue = get(a, column)
    const bValue = get(b, column)
    return defaultSort(aValue, bValue, direction)
  })
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

const queriedRows = computed<T[]>(() => {
  const queried = q.value
    ? sortedRows.value.filter((row) => {
      return Object.values(row).some((value) => {
        return String(value).toLowerCase().includes(q.value.toLowerCase())
      })
    })
    : sortedRows.value
  const applyFilter = filters.value.find(f => f.key === filter.value)
  if (applyFilter)
    return applyFilter.filter(queried)
  return queried
})

function toggleFilter(_filter: string) {
  if (filter.value === _filter)
    filter.value = null
  else
    filter.value = _filter
}
const pageCount = props.pageCount || 8
const paginatedRows = computed<T[]>(() => {
  return queriedRows.value.slice((page.value - 1) * pageCount, (page.value) * pageCount)
})

function updateSort(_sort: any) {
  if (_sort.column === null) {
    sort.value = null
    return
  }
  sort.value = {
    column: _sort.column,
    direction: _sort.direction,
  }
}

const columns = computed(() => {
  return [props.expandable ? { key: 'expand' } : null, ...props.columns].filter(Boolean).map(c => ({
    ...c,
    slotName: `${c.key}-data`,
  }))
})

watch(expandedRow, () => {
  emit('update:expanded', expandedRow.value ? paginatedRows.value[expandedRow.value] : null)
})

const tableUi = {
  th: {
    padding: 'px-2 py-2',
  },
  td: {
    padding: 'px-2 py-1',
  },
}
</script>

<template>
  <div>
    <div class="flex justify-between">
      <slot name="header" />
      <div v-if="searchable" class="flex items-center gap-5 mb-2">
        <div class="flex w-[300px] dark:border-gray-700">
          <UInput
            v-model="q"
            class="w-full"
            placeholder="Search..."
            icon="i-heroicons-magnifying-glass"
            autocomplete="off"
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
            {{ _filter.label }} <span v-if="_filter.key === filter"> - {{ queriedRows.length }}</span>
          </UTooltip>
        </UBadge>
        <UBadge v-for="_filter in filters.filter(f => !f.special)" :key="_filter.key" class="cursor-pointer" :ui="{ rounded: 'rounded-full' }" :color="filter === _filter.key ? 'green' : 'gray'" :variant="filter === _filter.key ? 'subtle' : 'soft'" @click="toggleFilter(_filter.key)">
          <UTooltip :text="_filter.description || ''" class="flex gap-1 items-center">
            {{ _filter.label }} <span v-if="_filter.key === filter"> - {{ queriedRows.length }}</span>
          </UTooltip>
        </UBadge>
      </div>
    </div>
    <UDivider />
    <UTable :loading="!value" :rows="paginatedRows" :columns="columns" :ui="tableUi" @update:sort="updateSort">
      <template #expand-data="{ index }">
        <UButton :icon="expandedRow === index ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" color="gray" size="xs" variant="ghost" @click="toggleExpandedRow(index)" />
      </template>
      <!-- we need to re-implement the slots i think  -->
      <template v-for="column in columns.filter(c => c.key !== 'expand')" #[column.slotName]="data">
        <slot :name="column.slotName" v-bind="data" :rows="paginatedRows" :expanded="expandedRow === data.index" />
      </template>
    </UTable>
    <div v-if="queriedRows.length > 8" class="flex items-center justify-between mt-7 px-3 py-5 border-t border-gray-200 dark:border-gray-700">
      <UPagination v-model="page" :page-count="pageCount" :total="queriedRows.length" />
      <div class="text-base dark:text-gray-300 text-gray-600 mb-2">
        {{ queriedRows.length }} total
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup generic="T extends object">
import type { TableColumn } from '@nuxt/ui'
import { useUrlSearchParams } from '@vueuse/core'
import { get } from '#ui/utils'

interface LegacyTableColumn {
  key: string
  label?: string
  sortable?: boolean
}

interface TableFilter<T> {
  key: string
  label: string
  description?: string
  special?: boolean
  filter: (rows: T[]) => T[]
}

type SortState = { column: string, direction: 'asc' | 'desc' } | null

const props = withDefaults(defineProps<{
  value: T[]
  columns: Array<LegacyTableColumn | boolean | null>
  filters?: TableFilter<T>[]
  expandable?: boolean
  searchable?: boolean
  pageCount?: number
}>(), {
  filters: () => [],
  pageCount: 8,
  searchable: true,
})

const emit = defineEmits<{
  'update:expanded': [row: T | null]
  'update:rows': [rows: T[]]
  'pageChange': [page: number]
}>()

const params = useUrlSearchParams('history', {
  removeNullishValues: true,
  removeFalsyValues: false,
})

function readStringParam(value: string | number | string[] | undefined, fallback: string) {
  if (Array.isArray(value))
    return value[0] ?? fallback
  return value === undefined ? fallback : String(value)
}

const sort = ref<SortState>(null)
const q = ref(readStringParam(params.q, ''))
const page = ref(Number.parseInt(readStringParam(params.page, '1'), 10) || 1)
const filter = ref(readStringParam(params.filter, 'default'))
const expandedRow = ref<number | null>(null)

const rows = computed(() => props.value)

function isLegacyColumn(column: LegacyTableColumn | boolean | null): column is LegacyTableColumn {
  return typeof column === 'object' && column !== null
}

function clearSearch() {
  q.value = ''
}

watch([q, filter, page], () => {
  params.q = q.value
  params.filter = filter.value
  params.page = String(page.value)
})

watch([q, filter, page, sort], () => {
  expandedRow.value = null
})

function toggleExpandedRow(index: number) {
  expandedRow.value = expandedRow.value === index ? null : index
}

function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc') {
  if (a === b)
    return 0
  const result = String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true })
  return direction === 'asc' ? result : -result
}

const sortedRows = computed(() => {
  if (!sort.value)
    return rows.value
  const { column, direction } = sort.value
  return rows.value.slice().sort((a, b) => compareValues(get(a as Record<string, unknown>, column), get(b as Record<string, unknown>, column), direction))
})

const filters = computed<TableFilter<T>[]>(() => [{
  key: 'default',
  label: 'Show all',
  filter: rows => rows,
}, ...props.filters])

const queriedRows = computed(() => {
  const queried = q.value
    ? sortedRows.value.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(q.value.toLowerCase())))
    : sortedRows.value
  return filters.value.find(item => item.key === filter.value)?.filter(queried) ?? queried
})

const paginatedRows = computed(() => queriedRows.value.slice(
  (page.value - 1) * props.pageCount,
  page.value * props.pageCount,
))

watch(page, value => emit('pageChange', value))
watch(paginatedRows, value => emit('update:rows', value), { immediate: true })
watch(expandedRow, (index) => {
  emit('update:expanded', index === null ? null : paginatedRows.value[index] ?? null)
})

function toggleFilter(key: string) {
  filter.value = filter.value === key ? 'default' : key
}

function toggleSort(column: string) {
  if (sort.value?.column !== column) {
    sort.value = { column, direction: 'asc' }
    return
  }
  if (sort.value.direction === 'asc') {
    sort.value = { column, direction: 'desc' }
    return
  }
  sort.value = null
}

const displayColumns = computed(() => [
  ...(props.expandable ? [{ key: 'expand' }] : []),
  ...props.columns.filter(isLegacyColumn),
])

const tableColumns = computed<TableColumn<T>[]>(() => displayColumns.value.map(column => ({
  id: column.key,
  accessorKey: column.key,
  header: column.label ?? '',
  enableSorting: false,
})))

const tableUi = {
  th: 'px-2 py-2 text-xs font-normal',
  td: 'px-2 py-1',
}
</script>

<template>
  <div>
    <template v-if="searchable || $slots.header">
      <div class="flex justify-between">
        <slot name="header" />
        <div v-if="searchable" class="flex items-center gap-5 mb-2">
          <UInput
            v-model="q"
            class="w-[300px]"
            placeholder="Search..."
            icon="i-heroicons-magnifying-glass"
            autocomplete="off"
          >
            <template #trailing>
              <UButton
                v-show="q !== ''"
                color="neutral"
                variant="link"
                icon="i-heroicons-x-mark"
                @click="clearSearch"
              />
            </template>
          </UInput>
        </div>
        <div v-if="filters.length > 1" class="flex items-center gap-3 mb-3">
          <UBadge
            v-for="item in filters"
            :key="item.key"
            class="cursor-pointer rounded-full"
            :color="filter === item.key ? 'success' : 'neutral'"
            :variant="filter === item.key ? 'subtle' : 'soft'"
            @click="toggleFilter(item.key)"
          >
            <UTooltip :text="item.description || ''" class="flex gap-1 items-center">
              <UIcon v-if="item.special" name="i-heroicons-sparkles" class="size-4" />
              {{ item.label }} <span v-if="item.key === filter"> · {{ queriedRows.length }}</span>
            </UTooltip>
          </UBadge>
        </div>
      </div>
      <USeparator />
    </template>

    <UTable :data="paginatedRows" :columns="tableColumns" :ui="tableUi">
      <template v-for="column in displayColumns" :key="column.key" #[`${column.key}-header`]="data">
        <slot
          v-if="$slots[`${column.key}-header`]"
          :name="`${column.key}-header`"
          v-bind="data"
          :rows="paginatedRows"
        />
        <UButton
          v-else-if="column.sortable"
          color="neutral"
          variant="ghost"
          size="xs"
          :label="column.label"
          :icon="sort?.column === column.key ? (sort.direction === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down') : undefined"
          @click="toggleSort(column.key)"
        />
        <span v-else>{{ column.label }}</span>
      </template>

      <template #expand-cell="{ row }">
        <UButton
          :icon="expandedRow === row.index ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
          color="neutral"
          size="xs"
          variant="ghost"
          @click="toggleExpandedRow(row.index)"
        />
      </template>

      <template v-for="column in displayColumns.filter(column => column.key !== 'expand')" :key="column.key" #[`${column.key}-cell`]="data">
        <slot
          :name="`${column.key}-data`"
          v-bind="data"
          :row="data.row.original"
          :rows="paginatedRows"
          :index="data.row.index"
          :expanded="expandedRow === data.row.index"
        />
      </template>
    </UTable>

    <div v-if="queriedRows.length > pageCount" class="flex items-center justify-between mt-7 px-3 py-5 border-t border-default">
      <UPagination v-model:page="page" :items-per-page="pageCount" :total="queriedRows.length" />
      <div class="text-base text-muted mb-2">
        {{ queriedRows.length }} total
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export interface TableAsyncDataProps {
  filter?: string
  expandable?: boolean
  searchable?: boolean
  pageSize?: number
  pagination?: boolean
  sort?: { column?: string, direction?: 'asc' | 'desc' }
  filters?: Array<{
    key: string
    label: string
    description?: string
    special?: boolean
  }>
}
</script>

<script lang="ts" setup generic="T extends object = Record<string, unknown>">
import type { TableColumn } from '@nuxt/ui'
import { useUrlSearchParams } from '@vueuse/core'

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
  filter?: (rows: T[]) => T[]
}

interface TableAsyncDataResult<T> {
  rows: T[]
  total: number
  totals?: unknown
}

type SortState = { column?: string, direction?: 'asc' | 'desc' }

interface TableAsyncDataGenericProps<T extends object> {
  filter?: string
  expandable?: boolean
  searchable?: boolean
  pageSize?: number
  pagination?: boolean
  sort?: SortState
  filters?: TableFilter<T>[]
}

const props = withDefaults(defineProps<{
  path: string
  columns: Array<LegacyTableColumn | false | null>
} & TableAsyncDataGenericProps<T>>(), {
  filters: () => [],
  pageSize: 10,
  pagination: true,
  searchable: true,
})

const emit = defineEmits<{
  'totals': [totals: unknown]
  'update:expanded': [row: T | null]
  'pageChange': [page: number]
}>()

const value = shallowRef<TableAsyncDataResult<T>>({ rows: [], total: 0 })
const sort = ref<SortState>({ ...props.sort })
const params = useUrlSearchParams('history', {
  removeNullishValues: true,
  removeFalsyValues: false,
})

function readStringParam(value: string | number | string[] | undefined, fallback: string) {
  if (Array.isArray(value))
    return value[0] ?? fallback
  return value === undefined ? fallback : String(value)
}

const q = ref(readStringParam(params.q, ''))
const page = ref(Number.parseInt(readStringParam(params.page, '1'), 10) || 1)
const filter = ref(readStringParam(params.filter, props.filter || 'default'))
const expandedRow = ref<number | null>(null)
const isLoading = ref(true)
const rows = computed(() => value.value.rows)

function isLegacyColumn(column: LegacyTableColumn | false | null): column is LegacyTableColumn {
  return Boolean(column)
}

function clearSearch() {
  q.value = ''
}

const dataProvider = inject<Ref<unknown> | null>('tableAsyncDataProvider', null)

async function refresh() {
  isLoading.value = true
  const activeFilter = [filter.value, props.filter]
    .filter((item): item is string => Boolean(item) && item !== 'default')
    .join(',')

  value.value = await $fetch<TableAsyncDataResult<T>>(props.path, {
    query: {
      q: q.value,
      page: page.value,
      filter: activeFilter,
      sort: sort.value,
      pageSize: props.pageSize,
    },
  }).finally(() => {
    isLoading.value = false
  })

  emit('totals', value.value.totals)
  if (dataProvider)
    dataProvider.value = value.value
}

onMounted(refresh)

watch([q, filter, page, sort], () => {
  expandedRow.value = null
  params.q = q.value
  params.filter = filter.value
  params.page = String(page.value)
  void refresh()
}, { deep: true })

watch(page, value => emit('pageChange', value))
watch(expandedRow, (index) => {
  emit('update:expanded', index === null ? null : rows.value[index] ?? null)
})

const filters = computed<TableFilter<T>[]>(() => [{
  key: 'default',
  label: 'Show all',
  filter: rows => rows,
}, ...props.filters])

function toggleExpandedRow(index: number) {
  expandedRow.value = expandedRow.value === index ? null : index
}

function toggleFilter(key: string) {
  filter.value = filter.value === key ? 'default' : key
}

function toggleSort(column: string) {
  if (sort.value.column !== column) {
    sort.value = { column, direction: 'asc' }
    return
  }
  if (sort.value.direction === 'asc') {
    sort.value = { column, direction: 'desc' }
    return
  }
  sort.value = {}
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
            class="w-[200px]"
            placeholder="Search..."
            icon="i-heroicons-magnifying-glass"
            autocomplete="off"
            size="xs"
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
              {{ item.label }}
            </UTooltip>
          </UBadge>
        </div>
      </div>
      <USeparator />
    </template>

    <UTable :loading="isLoading" :data="rows" :columns="tableColumns" :ui="tableUi">
      <template v-for="column in displayColumns" #[`${column.key}-header`]="data">
        <slot
          v-if="$slots[`${column.key}-header`]"
          :name="`${column.key}-header`"
          v-bind="data"
          :value="value"
          :rows="rows"
        />
        <UButton
          v-else-if="column.sortable"
          color="neutral"
          variant="ghost"
          size="xs"
          :label="column.label"
          :icon="sort.column === column.key ? (sort.direction === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down') : undefined"
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

      <template v-for="column in displayColumns.filter(column => column.key !== 'expand')" #[`${column.key}-cell`]="data">
        <slot
          :name="`${column.key}-data`"
          v-bind="data"
          :row="data.row.original"
          :value="value"
          :rows="rows"
          :index="data.row.index"
          :expanded="expandedRow === data.row.index"
        />
      </template>
    </UTable>

    <div v-if="pagination && value.total > pageSize" class="flex items-center gap-3 pt-3">
      <UPagination
        v-model:page="page"
        size="xs"
        :items-per-page="pageSize"
        :total="value.total"
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

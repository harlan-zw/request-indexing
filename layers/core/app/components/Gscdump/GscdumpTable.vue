<script lang="ts" setup>
import type { Filter, Metric } from 'gscdump/query'
import type { GscComparisonFilter } from '~~/layers/core/app/composables/useGscdump'

const props = withDefaults(defineProps<{
  siteId: string
  dimension: 'page' | 'query' | 'queryCanonical' | 'country' | 'device' | 'date'
  period?: import('~~/layers/core/app/composables/useGscdump').Period
  pageSize?: number
  columns: Array<{ key: string, label: string, sortable?: boolean, class?: string }>
  searchable?: boolean
  sortable?: boolean
  pagination?: boolean
  excludeColumns?: string[]
  defaultSort?: { column: Metric | 'date', direction: 'asc' | 'desc' }
  extraFilters?: Array<Filter<object>>
  filters?: Array<{ key: GscComparisonFilter, label: string, special?: boolean, description?: string }>
}>(), {
  pageSize: 10,
  searchable: true,
  sortable: true,
  pagination: true,
})

const { period: dashboardPeriod } = useDashboardPeriod()
const activePeriod = computed(() => props.period || dashboardPeriod.value)

const tableData = useGscdumpTableData({
  siteId: () => props.siteId,
  dimension: props.dimension,
  period: activePeriod,
  pageSize: props.pageSize,
  defaultSort: props.defaultSort,
  extraFilters: () => props.extraFilters,
})

const visibleColumns = computed(() => {
  if (!props.excludeColumns?.length)
    return props.columns
  return props.columns.filter(c => !props.excludeColumns!.includes(c.key))
})

// Nuxt UI v4's table is TanStack-backed and needs `accessorKey`/`header`. This
// component still passed the v2 `{ key, label }` shape, which produces column
// defs with no id, so TanStack threw inside `recurseColumns` while building
// header groups. That surfaced as a 500 on every server-rendered route holding
// a table. The `{ key, label }` prop shape is kept as this component's public
// API and translated here.
const tableColumns = computed(() => visibleColumns.value.map(c => ({
  accessorKey: c.key,
  header: c.label,
  meta: c.class ? { class: { th: c.class, td: c.class } } : undefined,
})))

const allFilters = computed(() => {
  return [
    { key: 'default' as const, label: 'Show all' },
    ...(props.filters || [
      { key: 'new' as GscComparisonFilter, label: 'New' },
      { key: 'lost' as GscComparisonFilter, label: 'Lost' },
      { key: 'improving' as GscComparisonFilter, label: 'Improving' },
      { key: 'declining' as GscComparisonFilter, label: 'Declining' },
    ]),
  ]
})

defineExpose({ tableData })
</script>

<template>
  <div>
    <div v-if="searchable || filters" class="flex justify-between">
      <div v-if="searchable" class="flex items-center gap-5 mb-2">
        <div class="flex w-[200px]">
          <UInput
            v-model="tableData.q.value"
            class="w-full"
            placeholder="Search..."
            icon="i-heroicons-magnifying-glass"
            autocomplete="off"
            size="xs"
          >
            <template #trailing>
              <UButton
                v-show="tableData.q.value"
                color="neutral"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="tableData.q.value = ''"
              />
            </template>
          </UInput>
        </div>
      </div>
      <div v-if="allFilters.length > 1" class="flex items-center gap-3 mb-3">
        <UBadge
          v-for="f in allFilters"
          :key="f.key"
          class="cursor-pointer"
          :ui="{ base: 'rounded-full' }"
          :color="tableData.filter.value === f.key ? 'green' : 'gray'"
          :variant="tableData.filter.value === f.key ? 'subtle' : 'soft'"
          @click="tableData.toggleFilter(f.key)"
        >
          <UTooltip :text="f.description || ''" class="flex gap-1 items-center">
            <UIcon v-if="f.special" name="i-heroicons-sparkles" class="w-4 h-4" />
            {{ f.label }}
          </UTooltip>
        </UBadge>
      </div>
    </div>
    <USeparator v-if="searchable || filters" />
    <!-- Sorting stays manual through `tableData.toggleSort` in the header slot
         below, so no TanStack sorting state is bound here. -->
    <UTable
      :loading="tableData.isLoading.value"
      :data="tableData.rows.value"
      :columns="tableColumns"
      :ui="{
        th: 'px-2 py-2 text-xs font-normal',
        td: 'px-2 py-1',
      }"
    >
      <!-- v4 renamed the cell slot to `-cell` and hands back a TanStack row.
           Call sites still receive the `-data` name and a plain row object, so
           this migration stays inside the component. -->
      <template v-for="col in visibleColumns" :key="col.key" #[`${col.key}-cell`]="ctx">
        <slot :name="`${col.key}-data`" v-bind="{ ...ctx, row: ctx.row.original }" :table-data="tableData" />
      </template>
      <template v-for="col in visibleColumns" :key="`h-${col.key}`" #[`${col.key}-header`]="data">
        <slot :name="`${col.key}-header`" v-bind="data">
          <button v-if="sortable && col.sortable" class="flex items-center gap-1" @click="tableData.toggleSort(col.key as Metric | 'date')">
            {{ col.label }}
            <UIcon
              v-if="tableData.sort.value.column === col.key"
              :name="tableData.sort.value.direction === 'asc' ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'"
              class="w-3 h-3"
            />
          </button>
          <span v-else>{{ col.label }}</span>
        </slot>
      </template>
    </UTable>
    <div v-if="pagination && tableData.total.value > pageSize" class="flex items-center gap-3 pt-3">
      <!-- v4 pagination: `v-model:page` + `items-per-page`; the v2
           `page-count`/`max`/`*-button` props no longer exist. -->
      <UPagination
        v-model:page="tableData.page.value"
        :items-per-page="pageSize"
        :total="tableData.total.value"
        :sibling-count="2"
        size="xs"
        variant="link"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(th:first-child) { padding-left: 0 !important; }
:deep(td:first-child) { padding-left: 0 !important; }
:deep(th:last-child) { padding-right: 0 !important; }
:deep(td:last-child) { padding-right: 0 !important; }
</style>

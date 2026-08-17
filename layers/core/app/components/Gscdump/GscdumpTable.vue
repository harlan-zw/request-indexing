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

interface TableFilter {
  key: GscComparisonFilter | 'default'
  label: string
  special?: boolean
  description?: string
}

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

const allFilters = computed<TableFilter[]>(() => {
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
    <!-- The search box and the filter chips used to sit at opposite ends of the
         row, so they read as two unrelated controls. They are one group. -->
    <div v-if="searchable || filters" class="flex flex-wrap items-center gap-3">
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
              <!-- v4 dropped `padded`. Padding comes from the size variant, so
                   `p-0` on the class is what tightens the button now. -->
              <UButton
                v-show="tableData.q.value"
                color="neutral"
                variant="link"
                icon="i-heroicons-x-mark"
                aria-label="Clear search"
                class="p-0"
                @click="tableData.q.value = ''"
              />
            </template>
          </UInput>
        </div>
      </div>
      <!-- At 390px the chips wrapped mid-label and deformed, and the row pushed
           the page wider than the viewport. They scroll as one row instead. -->
      <!-- These were `UBadge`, which renders a `<span>`. The primary filter of
           every data table was therefore mouse-only: no focus, no Enter, no
           pressed state. Real buttons carry all three. -->
      <div v-if="allFilters.length > 1" class="mb-3 flex max-w-full items-center gap-3 overflow-x-auto">
        <UTooltip
          v-for="f in allFilters"
          :key="f.key"
          :text="f.description || ''"
        >
          <UButton
            class="shrink-0 whitespace-nowrap rounded-full"
            size="xs"
            :icon="f.special ? 'i-heroicons-sparkles' : undefined"
            :color="tableData.filter.value === f.key ? 'success' : 'neutral'"
            :variant="tableData.filter.value === f.key ? 'subtle' : 'soft'"
            :aria-pressed="tableData.filter.value === f.key"
            @click="tableData.toggleFilter(f.key)"
          >
            {{ f.label }}
          </UButton>
        </UTooltip>
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
    <div v-if="pagination && tableData.total.value > pageSize" class="flex flex-wrap items-center justify-between gap-3 pt-3">
      <!-- v4 pagination: `v-model:page` + `items-per-page`; the v2
           `page-count`/`max`/`*-button` props no longer exist.
           First/last jump arrows are off: they added two controls to a two-page
           list and the reader was never told how many rows there are. -->
      <UPagination
        v-model:page="tableData.page.value"
        :items-per-page="pageSize"
        :total="tableData.total.value"
        :sibling-count="2"
        :show-edges="false"
        size="xs"
        variant="link"
      />
      <p class="text-xs text-muted tabular-nums">
        {{ useHumanFriendlyNumber(tableData.total.value) }} rows
      </p>
    </div>
  </div>
</template>

<style scoped>
:deep(th:first-child) { padding-left: 0 !important; }
:deep(td:first-child) { padding-left: 0 !important; }
:deep(th:last-child) { padding-right: 0 !important; }
:deep(td:last-child) { padding-right: 0 !important; }
</style>

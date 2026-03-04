<script lang="ts" setup>
import type { GscComparisonFilter, GscdumpDataRow, GscdumpTableResponse } from '~/composables/useGscdump'

const props = withDefaults(defineProps<{
  siteId: string
  dimension: 'page' | 'query' | 'queryCanonical' | 'country' | 'device' | 'date'
  period?: import('~/composables/useGscdump').Period
  pageSize?: number
  columns: Array<{ key: string, label: string, sortable?: boolean, class?: string }>
  searchable?: boolean
  sortable?: boolean
  pagination?: boolean
  excludeColumns?: string[]
  defaultSort?: { column: string, direction: 'asc' | 'desc' }
  extraFilters?: Array<{ type: string, column: string, value: string }>
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
          :ui="{ rounded: 'rounded-full' }"
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
    <UDivider v-if="searchable || filters" />
    <UTable
      v-model:sort="tableData.sort.value"
      sort-mode="manual"
      :loading="tableData.isLoading.value"
      :rows="tableData.rows.value"
      :columns="visibleColumns"
      :ui="{
        th: { padding: 'px-2 py-2', size: 'text-xs', font: 'font-normal' },
        td: { padding: 'px-2 py-1' },
      }"
    >
      <template v-for="col in visibleColumns" :key="col.key" #[`${col.key}-data`]="data">
        <slot :name="`${col.key}-data`" v-bind="data" :table-data="tableData" />
      </template>
      <template v-for="col in visibleColumns" :key="`h-${col.key}`" #[`${col.key}-header`]="data">
        <slot :name="`${col.key}-header`" v-bind="data">
          <button v-if="sortable && col.sortable" class="flex items-center gap-1" @click="tableData.toggleSort(col.key)">
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
      <UPagination
        v-model="tableData.page.value"
        :inactive-button="{ variant: 'link' }"
        :active-button="{ color: 'blue', variant: 'link', class: 'underline' }"
        :prev-button="false"
        :next-button="{ variant: 'link' }"
        size="xs"
        :page-count="pageSize"
        :max="5"
        :total="tableData.total.value"
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

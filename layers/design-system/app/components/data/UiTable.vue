<script setup lang="ts" generic="T extends object">
import type {
  Column,
  ColumnFiltersState,
  ColumnVisibilityState,
  ExpandedState,
  Row,
  RowSelectionState,
  SortingState,
} from '@tanstack/vue-table'
import type { UiTableColumn, UiTableFeatures, UiTableRowId, UiTableSize } from '../../shared/table'
import { FlexRender, functionalUpdate, useTable } from '@tanstack/vue-table'
import { useIntersectionObserver } from '@vueuse/core'
import { computed, ref, toRef, useId, useSlots, useTemplateRef, watch } from 'vue'
import { UiButton, UiSkeleton, UiTableFrame, UiTableHeaderCell, UPagination } from '#components'
import { resolveUiTableRowId, uiTableCellSizeClass, uiTableFeatures, uiTableSkeletonSizeClass, uiTableVisibleFromClass } from '../../shared/table'

const {
  data,
  columns,
  selected,
  controlledSelection = false,
  rowHover = false,
  rowClickable = false,
  enableSorting = false,
  manualSorting = false,
  pageSize = 10,
  ignoreHeader,
  size = 'md',
  loading = false,
  loadingRows = 5,
  rowId,
  manualPagination = false,
  disablePagination = false,
  total,
  rowClass,
  activeRowId,
  initialExpandedRowId,
  label,
  bordered = false,
  paginationPreset = 'default',
  fill = false,
} = defineProps<UiTableProps<T>>()

const emit = defineEmits<{
  'rowSelectionChange': [value: RowSelectionState]
  'rowClick': [row: T]
  'update:page': [page: number]
  'sortColumn': [column: string]
}>()

const selectedModel = defineModel<RowSelectionState>('selected')
const pageModel = defineModel<number>('page', { default: 1 })
const sortingModel = defineModel<SortingState>('sorting', { default: () => [] })
const tableInstanceId = useId()

const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<ColumnVisibilityState>({})
const rowSelection = ref(selected || {})
const expanded = ref<ExpandedState>({})
const pagination = ref({ pageIndex: 0, pageSize })

watch(() => initialExpandedRowId, (value) => {
  expanded.value = value ? { [value]: true } : {}
}, { immediate: true })

watch(rowSelection, () => {
  emit('rowSelectionChange', rowSelection.value)
})

function getSortDirection(columnId: string): 'asc' | 'desc' | false {
  const entry = sortingModel.value.find(s => s.id === columnId)
  if (!entry)
    return false
  return entry.desc ? 'desc' : 'asc'
}

function getAriaSort(columnId: string): 'ascending' | 'descending' | 'none' {
  const dir = getSortDirection(columnId)
  if (dir === 'asc')
    return 'ascending'
  if (dir === 'desc')
    return 'descending'
  return 'none'
}

function toggleSort(columnId: string) {
  if (manualSorting) {
    emit('sortColumn', columnId)
    return
  }
  const current = sortingModel.value.find(s => s.id === columnId)
  if (!current)
    sortingModel.value = [{ id: columnId, desc: false }]
  else if (!current.desc)
    sortingModel.value = [{ id: columnId, desc: true }]
  else
    sortingModel.value = []
}

function setClientPage(page: number) {
  table.setPageIndex(page - 1)
  pageModel.value = page
  emit('update:page', page)
}

function getTextAlignClass(align?: 'left' | 'center' | 'right', numeric = false): string {
  if (numeric)
    return 'text-right tabular-nums'
  if (align === 'center')
    return 'text-center'
  if (align === 'right')
    return 'text-right'
  return 'text-left'
}

function rowExpansionStateId(row: Row<UiTableFeatures, T>): string {
  return `${tableInstanceId}-row-${row.index}-expansion-state`
}

const nestedControlSelector = 'a, button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"]'

function eventTargetsNestedControl(event: Event): boolean {
  return event.target instanceof Element
    && event.target !== event.currentTarget
    && event.target.closest(nestedControlSelector) !== null
}

function activateRow(row: T, tanstackRow: Row<UiTableFeatures, T>) {
  if (!rowClickable)
    return
  emit('rowClick', row)
  if (slots['expanded-component']) {
    if (tanstackRow.getIsExpanded())
      expanded.value = {}
    else
      expanded.value = { [tanstackRow.id]: true }
  }
}

function onRowClick(e: MouseEvent, row: T, tanstackRow: Row<UiTableFeatures, T>) {
  if (eventTargetsNestedControl(e))
    return
  activateRow(row, tanstackRow)
}

function onRowKeydown(e: KeyboardEvent, row: T, tanstackRow: Row<UiTableFeatures, T>) {
  if (eventTargetsNestedControl(e))
    return
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    activateRow(row, tanstackRow)
  }
}

const slots = useSlots()

// Optional trailing actions column (row buttons/menus). Rendered outside the
// TanStack column model so callers express rich actions as a slot, not a cell
// render fn. `colSpan` accounts for it in the empty/skeleton rows.
const hasActions = computed(() => !!slots.actions)
const colSpan = computed(() => columns.length + (hasActions.value ? 1 : 0))

function uiColumnDef(column: Column<UiTableFeatures, T, unknown>): UiTableColumn<T> {
  return column.columnDef as UiTableColumn<T>
}

const table = useTable<UiTableFeatures, T>({
  features: uiTableFeatures,
  data: toRef(() => data),
  columns: toRef(() => columns),
  enableSorting,
  manualSorting,
  manualPagination,
  ...(manualPagination && total != null && { rowCount: total }),
  onPaginationChange: u => pagination.value = functionalUpdate(u, pagination.value),
  onSortingChange: u => sortingModel.value = functionalUpdate(u, sortingModel.value),
  onColumnFiltersChange: u => columnFilters.value = functionalUpdate(u, columnFilters.value),
  onColumnVisibilityChange: u => columnVisibility.value = functionalUpdate(u, columnVisibility.value),
  getRowId: (row, index) => resolveUiTableRowId(row, index, rowId),
  onRowSelectionChange(u) {
    const target = controlledSelection ? selectedModel : rowSelection
    target.value = functionalUpdate(u, target.value ?? {})
  },
  onExpandedChange: u => expanded.value = functionalUpdate(u, expanded.value),
  state: {
    get pagination() { return pagination.value },
    get sorting() { return sortingModel.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return controlledSelection ? selectedModel.value ?? {} : rowSelection.value },
    get expanded() { return expanded.value },
  },
})

const currentPage = computed(() => table.atoms.pagination.get().pageIndex + 1)
const paginationTotal = computed(() => manualPagination ? total ?? 0 : data.length)
const paginationPage = computed(() => manualPagination ? pageModel.value : currentPage.value)
const paginationPageCount = computed(() => Math.max(1, Math.ceil(paginationTotal.value / pageSize)))
const showPagination = computed(() => !disablePagination && paginationTotal.value > pageSize)

function setPaginationPage(page: number): void {
  if (manualPagination) {
    pageModel.value = page
    emit('update:page', page)
    return
  }
  setClientPage(page)
}

// `sm:` is a viewport width and says nothing about the pointer; a touch tablet
// is wide AND needs the 44px target.
const PAGINATION_TARGET = 'min-h-11 min-w-11 [@media(pointer:fine)]:min-h-8 [@media(pointer:fine)]:min-w-8'
const paginationUi = {
  first: PAGINATION_TARGET,
  prev: PAGINATION_TARGET,
  item: PAGINATION_TARGET,
  next: PAGINATION_TARGET,
  last: PAGINATION_TARGET,
} as const

// Exposed so callers can reach the TanStack instance (e.g. a column-visibility
// menu via `getAllLeafColumns()`).
defineExpose({ table })

// Sticky-header shadow: a zero-height sentinel sits at the top of the wrapper;
// once it scrolls out through the top the sticky thead has reached the edge, so
// we lift it. IntersectionObserver fires only on crossing — no per-scroll
// `getBoundingClientRect()` reflow (the old window-scroll listener ran a
// querySelector + layout read on every tick, for every mounted table).
const sentinelEl = useTemplateRef<HTMLElement>('sentinelEl')
const isScrolled = ref(false)

useIntersectionObserver(sentinelEl, ([entry]) => {
  if (entry)
    isScrolled.value = !entry.isIntersecting
})

// Dev guard: pagination (default + manual) bounds the rendered rows, but
// `disablePagination` mounts every row. Warn before that becomes a perf problem
// so the caller paginates or caps the list rather than virtualizing blindly.
if (import.meta.dev) {
  const ROW_WARN_THRESHOLD = 150
  let warned = false
  watch(() => disablePagination && data.length, () => {
    if (disablePagination && data.length > ROW_WARN_THRESHOLD && !warned) {
      warned = true
      console.warn(`[UiTable] rendering ${data.length} rows with disablePagination — every row mounts to the DOM. Paginate, cap the list, or split it to keep rendering performant.`)
    }
  }, { immediate: true })
}
</script>

<script lang="ts">
export interface UiTableProps<T extends object> {
  data: T[]
  columns: UiTableColumn<T>[]
  selected?: RowSelectionState
  controlledSelection?: boolean
  rowHover?: boolean
  rowClickable?: boolean
  enableSorting?: boolean
  /** Caller owns sort state; UiTable emits @sortColumn and bypasses client-side sorting. */
  manualSorting?: boolean
  pageSize?: number
  ignoreHeader?: boolean
  size?: UiTableSize
  loading?: boolean
  loadingRows?: number
  rowId?: UiTableRowId<T>
  manualPagination?: boolean
  disablePagination?: boolean
  total?: number
  /** Accessible name for the table. Rendered as a visually-hidden <caption>. */
  label: string
  /** Draw the canonical rounded table surface. */
  bordered?: boolean
  /** Pagination density. Compact renders previous, page position, and next only. */
  paginationPreset?: 'default' | 'compact'
  /** Fill the caller's available height and keep pagination pinned to the bottom. */
  fill?: boolean
  /** Extra classes applied per data row — e.g. a selection highlight. */
  rowClass?: (row: T) => string
  /** Row id presented as the active item in a click-through table. */
  activeRowId?: string
  /** Row id to open when the table first receives deep-linked evidence. */
  initialExpandedRowId?: string
}
</script>

<template>
  <div class="w-full" :class="fill && 'flex h-full min-h-0 flex-col'">
    <UiTableFrame
      name="UiTable"
      :class="fill && 'min-h-0 flex-1'"
      :bordered="bordered"
      :row-hover="rowHover || rowClickable"
      :scrolled="isScrolled"
      :scroll-label="label ? `${label} table scroll area` : undefined"
    >
      <div ref="sentinelEl" aria-hidden="true" class="h-px w-full" />
      <table class="w-full" :data-size="size" :aria-busy="loading || undefined">
        <caption v-if="label" class="sr-only">
          {{ label }}
        </caption>
        <thead v-if="!ignoreHeader">
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="h-10">
            <th
              v-for="header in headerGroup.headers"
              :key="header.id"
              class="text-label text-left whitespace-nowrap border-b border-default bg-default"
              :class="[
                uiColumnDef(header.column).noPadding ? '' : header.column.getCanSort() ? 'px-2' : 'px-3',
                getTextAlignClass(uiColumnDef(header.column).align, uiColumnDef(header.column).numeric),
                uiColumnDef(header.column).visibleFrom ? uiTableVisibleFromClass[uiColumnDef(header.column).visibleFrom!] : '',
                uiColumnDef(header.column).headClass,
              ]"
              :aria-sort="header.column.getCanSort() ? getAriaSort(header.column.id) : undefined"
              scope="col"
            >
              <UiTableHeaderCell
                :header="header"
                :sort-direction="getSortDirection(header.column.id)"
                @sort="toggleSort"
              />
            </th>
            <th v-if="hasActions" class="w-px border-b border-default bg-default" scope="col">
              <span class="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="table.getRowModel().rows?.length">
            <tr class="spacer" />
            <template v-for="row in table.getRowModel().rows" :key="row.id">
              <tr
                :data-state="(row.getIsSelected() || row.id === activeRowId) && 'selected'"
                :data-expanded="row.getIsExpanded()"
                :data-row-id="row.id"
                :tabindex="rowClickable ? 0 : undefined"
                :aria-describedby="rowClickable && slots['expanded-component'] ? rowExpansionStateId(row) : undefined"
                :aria-selected="row.getIsSelected() || row.id === activeRowId ? true : undefined"
                :class="[
                  rowClickable && 'cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                  rowClass?.(row.original),
                ]"
                @click="onRowClick($event, row.original, row)"
                @keydown="rowClickable && onRowKeydown($event, row.original, row)"
              >
                <component
                  :is="uiColumnDef(cell.column).rowHeader ? 'th' : 'td'"
                  v-for="cell in row.getVisibleCells()"
                  :key="cell.id"
                  :scope="uiColumnDef(cell.column).rowHeader ? 'row' : undefined"
                  class="text-xs font-normal text-default relative"
                  :class="[
                    uiTableCellSizeClass[size],
                    uiColumnDef(cell.column).noPadding ? '' : cell.column.getCanSort() ? 'px-2' : 'px-3',
                    getTextAlignClass(uiColumnDef(cell.column).align, uiColumnDef(cell.column).numeric),
                    uiColumnDef(cell.column).visibleFrom ? uiTableVisibleFromClass[uiColumnDef(cell.column).visibleFrom!] : '',
                    uiColumnDef(cell.column).cellClass,
                    uiColumnDef(cell.column).ui?.td?.base || '',
                  ]"
                >
                  <span
                    v-if="rowClickable && slots['expanded-component'] && cell.id === row.getVisibleCells()[0]?.id"
                    :id="rowExpansionStateId(row)"
                    class="sr-only"
                  >
                    {{ row.getIsExpanded() ? 'Expanded.' : 'Collapsed.' }}
                    Press Enter or Space to {{ row.getIsExpanded() ? 'collapse' : 'expand' }} row details.
                  </span>
                  <UiSkeleton
                    v-if="loading && !uiColumnDef(cell.column).stableData"
                    :class="[uiTableSkeletonSizeClass[size]]"
                    :index="row.index * columns.length + cell.column.getIndex()"
                    :base="60"
                    :range="50"
                  />
                  <FlexRender v-else :cell="cell" />
                </component>
                <td v-if="hasActions" class="text-right whitespace-nowrap px-3" :class="uiTableCellSizeClass[size]" @click.stop>
                  <slot name="actions" :row="row.original" />
                </td>
              </tr>
              <tr v-if="row.getIsExpanded()" class="expanded-row">
                <td :colspan="colSpan" class="px-2 pb-2">
                  <div class="rounded-lg bg-accented">
                    <slot name="expanded-component" :row="row.original" />
                  </div>
                </td>
              </tr>
            </template>
          </template>

          <template v-else-if="loading">
            <tr class="spacer" />
            <tr v-for="i in loadingRows" :key="`skeleton-${i}`">
              <td
                v-for="(col, j) in columns"
                :key="j"
                class="text-xs px-3"
                :class="[
                  uiTableCellSizeClass[size],
                  getTextAlignClass(col.align, col.numeric),
                  col.visibleFrom ? uiTableVisibleFromClass[col.visibleFrom] : '',
                ]"
              >
                <UiSkeleton class="h-4" :index="i * columns.length + j" :base="60" :range="50" />
              </td>
            </tr>
          </template>

          <tr v-else>
            <td :colspan="colSpan" class="h-24 text-center" role="status">
              <slot name="empty-component">
                <span class="text-xs font-mono text-dimmed">0 rows · adjust filters</span>
              </slot>
            </td>
          </tr>
        </tbody>
        <slot name="tfoot" />
      </table>
    </UiTableFrame>

    <nav
      v-if="showPagination && paginationPreset === 'compact'"
      class="mt-3 flex items-center justify-center gap-1 sm:justify-end"
      :aria-label="`${label} pagination`"
    >
      <UiButton
        purpose="quiet"
        icon="chevron-left"
        size="xs"
        class="min-h-11 min-w-11 [@media(pointer:fine)]:min-h-8 [@media(pointer:fine)]:min-w-8"
        :disabled="paginationPage <= 1"
        aria-label="Previous page"
        @click="setPaginationPage(paginationPage - 1)"
      />
      <span class="min-w-14 text-center text-sm tabular-nums text-muted" aria-live="polite">
        {{ paginationPage }} / {{ paginationPageCount }}
      </span>
      <UiButton
        purpose="quiet"
        icon="chevron-right"
        size="xs"
        class="min-h-11 min-w-11 [@media(pointer:fine)]:min-h-8 [@media(pointer:fine)]:min-w-8"
        :disabled="paginationPage >= paginationPageCount"
        aria-label="Next page"
        @click="setPaginationPage(paginationPage + 1)"
      />
    </nav>
    <UPagination
      v-else-if="paginationPreset === 'default' && !disablePagination && manualPagination && total != null && total > pageSize"
      class="mt-5"
      :page="pageModel"
      :items-per-page="pageSize"
      :total="total"
      :ui="paginationUi"
      @update:page="(e: number) => { pageModel = e; emit('update:page', e) }"
    />
    <UPagination
      v-else-if="paginationPreset === 'default' && !disablePagination && !manualPagination && data.length > pageSize"
      class="mt-5"
      :page="currentPage"
      :items-per-page="pageSize"
      :total="data.length"
      :ui="paginationUi"
      @update:page="setClientPage"
    />
  </div>
</template>

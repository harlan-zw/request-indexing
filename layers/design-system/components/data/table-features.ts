import type { ColumnDef, Row, RowData, RowSelectionState } from '@tanstack/vue-table'
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  metaHelper,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/vue-table'

export interface UiTableColumnMeta {
  align?: 'left' | 'center' | 'right'
  noPadding?: boolean
  stableData?: boolean
  tooltip?: string
  ui?: { td?: { base?: string } }
}

export const uiTableFeatures = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  columnVisibilityFeature,
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  columnMeta: metaHelper<UiTableColumnMeta>(),
})

export type UiTableFeatures = typeof uiTableFeatures
export type UiTableColumn<T extends RowData> = ColumnDef<UiTableFeatures, T, any>
export type UiTableRow<T extends RowData> = Row<UiTableFeatures, T>

export interface UiTableProps<T extends RowData> {
  data: T[]
  columns: UiTableColumn<T>[]
  selected?: RowSelectionState
  controlledSelection?: boolean
  rowHover?: boolean
  rowClickable?: boolean
  enableSorting?: boolean
  /** Caller owns sort state; UiTable emits @sortColumn and does not sort rows. */
  manualSorting?: boolean
  pageSize?: number
  ignoreHeader?: boolean
  size?: 'xs' | 'sm' | 'md'
  loading?: boolean
  loadingRows?: number
  rowId?: string | ((row: T) => string)
  manualPagination?: boolean
  disablePagination?: boolean
  total?: number
  /** Accessible name for the table. Rendered as a visually-hidden caption. */
  label?: string
}

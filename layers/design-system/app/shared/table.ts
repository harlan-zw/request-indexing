import type { ColumnDef } from '@tanstack/table-core'
import {
  columnFilteringFeature,
  columnOrderingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from '@tanstack/table-core'

export type UiTableSize = 'xs' | 'sm' | 'md'
export type UiTableAlign = 'left' | 'center' | 'right'

export const uiTableCellSizeClass: Record<UiTableSize, string> = {
  xs: 'h-11 py-1 sm:h-8',
  sm: 'h-11 py-1 sm:h-10',
  md: 'h-11 py-2 sm:h-10',
}

export const uiTableSkeletonSizeClass: Record<UiTableSize, string> = {
  xs: 'h-4',
  sm: 'h-4',
  md: 'h-6',
}

export type UiTableVisibleFrom = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface UiTableCellProps {
  align?: UiTableAlign
  numeric?: boolean
  visibleFrom?: UiTableVisibleFrom
}

export interface UiTableColumnMeta extends UiTableCellProps {
  noPadding?: boolean
  stableData?: boolean
  tooltip?: string
  headClass?: string
  cellClass?: string
  rowHeader?: boolean
  ui?: { td?: { base?: string } }
}

export const uiTableFeatures = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  columnOrderingFeature,
  columnVisibilityFeature,
  rowExpandingFeature,
  expandedRowModel: createExpandedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  rowSelectionFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
})

export type UiTableFeatures = typeof uiTableFeatures
export type UiTableColumn<T extends object> = ColumnDef<UiTableFeatures, T, unknown> & UiTableColumnMeta
export type UiTableRowId<T> = string | ((row: T) => string)

export const uiTableVisibleFromClass: Record<UiTableVisibleFrom, string> = {
  'sm': 'hidden sm:table-cell',
  'md': 'hidden md:table-cell',
  'lg': 'hidden lg:table-cell',
  'xl': 'hidden xl:table-cell',
  '2xl': 'hidden 2xl:table-cell',
}

<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { RowSelectionState, SortingState } from '@tanstack/vue-table'
import type { UiTableColumn, UiTableRowId } from '../../shared/table'
import type { UiIcon as UiIconName } from '../../shared/ui-icons'
import { refDebounced } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import { UiButton, UiIcon, UInput, UiTable, UPagination } from '#components'

const {
  pending = false,
  rows,
  total,
  columns,
  error,
  pageSize = 12,
  searchable = true,
  searchPlaceholder = 'Search…',
  emptyIcon = 'search',
  emptyTitle = 'No results found',
  emptyDescription = '',
  itemLabel = 'items',
  manualPagination = true,
  manualSorting = false,
  rowHover = true,
  rowClickable = false,
  rowId,
  label,
  filtersActive = false,
  formatTotal,
} = defineProps<{
  pending?: boolean
  rows: T[]
  total: number
  columns: UiTableColumn<T>[]
  error?: unknown
  pageSize?: number
  searchable?: boolean
  searchPlaceholder?: string
  emptyIcon?: UiIconName
  emptyTitle?: string
  emptyDescription?: string
  itemLabel?: string
  manualPagination?: boolean
  manualSorting?: boolean
  rowHover?: boolean
  rowClickable?: boolean
  rowId?: UiTableRowId<T>
  /** Accessible name for the table (passed through to <caption>). */
  label?: string
  /** Whether any non-search filter is currently active. Drives empty-state copy. */
  filtersActive?: boolean
  /** Caller-supplied number formatter for the pagination "X items total" caption. Defaults to toLocaleString. */
  formatTotal?: (n: number) => string
}>()

const emit = defineEmits<{
  retry: []
  sortColumn: [column: string]
  rowClick: [row: T]
}>()

const totalDisplay = computed(() => formatTotal ? formatTotal(total) : total.toLocaleString())

const search = defineModel<string>('search', { default: '' })
const page = defineModel<number>('page', { default: 1 })
const sorting = defineModel<SortingState>('sorting', { default: () => [] })
const rowSelection = defineModel<RowSelectionState>('rowSelection')
const rowSelectionEnabled = computed(() => rowSelection.value !== undefined)
const searchDraft = ref(search.value)
const debouncedSearch = refDebounced(searchDraft, 300)

const showEmpty = computed(() => !pending && !error && rows.length === 0)
const showTable = computed(() => !error && (pending || rows.length > 0))
const showPagination = computed(() => !pending && rows.length > 0 && total > pageSize)

const paginationUi = {
  first: 'min-h-11 min-w-11 sm:min-h-8 sm:min-w-8',
  prev: 'min-h-11 min-w-11 sm:min-h-8 sm:min-w-8',
  item: 'min-h-11 min-w-11 sm:min-h-8 sm:min-w-8',
  next: 'min-h-11 min-w-11 sm:min-h-8 sm:min-w-8',
  last: 'min-h-11 min-w-11 sm:min-h-8 sm:min-w-8',
} as const

watch(search, (value) => {
  if (value !== searchDraft.value)
    searchDraft.value = value
})

watch(debouncedSearch, (value) => {
  if (value !== search.value)
    search.value = value
})

function commitSearch(value = searchDraft.value) {
  searchDraft.value = value
  if (search.value !== value)
    search.value = value
}

function errorText(value: unknown): string {
  if (typeof value === 'string')
    return value
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string')
    return value.message
  return 'Failed to load'
}
</script>

<template>
  <div data-ui="UiDataTableSection" class="flex flex-col gap-4">
    <slot name="stats" />

    <!-- Filter row -->
    <div v-if="searchable || $slots['filters-leading'] || $slots['filters-trailing']" class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
      <div class="flex items-center gap-1.5 flex-wrap">
        <slot name="filters-leading" />
      </div>
      <div class="flex w-full items-center gap-3 sm:w-auto">
        <slot name="filters-trailing" />
        <UInput
          v-if="searchable"
          v-model="searchDraft"
          type="search"
          class="w-full sm:w-56"
          :placeholder="searchPlaceholder"
          icon="search"
          autocomplete="off"
          size="sm"
          :ui="{ base: 'min-h-11 transition-[width] duration-200 focus-within:w-72 sm:min-h-0' }"
          aria-label="Filter rows"
          data-inp-target="data-table-search"
          @keydown.enter="commitSearch()"
        >
          <template #trailing>
            <UiButton
              v-if="searchDraft !== ''"
              purpose="quiet"
              icon="close"
              size="xs"
              class="min-h-11 min-w-11 rounded-lg sm:min-h-0 sm:min-w-0"
              aria-label="Clear search"
              @click="commitSearch('')"
            />
          </template>
        </UInput>
      </div>
    </div>

    <slot name="notices" />

    <!-- Error -->
    <div v-if="error" role="alert" aria-live="assertive" class="rounded-xl border border-dashed border-default bg-[var(--ui-bg-elevated)]/5">
      <slot name="error" :error="error">
        <div class="py-10 text-center">
          <p class="text-sm text-error mb-3">
            {{ errorText(error) }}
          </p>
          <UiButton size="sm" purpose="secondary" @click="emit('retry')">
            Retry
          </UiButton>
        </div>
      </slot>
    </div>

    <!-- Empty -->
    <div v-else-if="showEmpty" role="status" data-testid="table-empty-state" class="rounded-xl border border-dashed border-default bg-[var(--ui-bg-elevated)]/5 py-16">
      <slot name="empty">
        <div class="text-center max-w-sm mx-auto">
          <UiIcon :name="emptyIcon" class="size-7 text-dimmed mb-3 inline-block" aria-hidden="true" />
          <h3 class="text-sm font-semibold text-default mb-1">
            {{ emptyTitle }}
          </h3>
          <p v-if="searchDraft || filtersActive || emptyDescription" class="text-sm text-muted mb-4">
            <template v-if="searchDraft">
              No {{ itemLabel }} match “<span class="font-medium text-default">{{ searchDraft }}</span>”
            </template>
            <template v-else-if="filtersActive">
              No {{ itemLabel }} match the selected filter
            </template>
            <template v-else>
              {{ emptyDescription }}
            </template>
          </p>
          <slot name="empty-actions">
            <UiButton
              v-if="searchDraft"
              size="sm"
              purpose="secondary"
              @click="commitSearch('')"
            >
              Clear search
            </UiButton>
          </slot>
        </div>
      </slot>
    </div>

    <!-- Body: defaults to the table; pass #body to render an alternate view
         (e.g. a card grid) while keeping the search / empty / pagination chrome. -->
    <template v-else-if="showTable">
      <slot name="body" :rows="rows" :pending="pending">
        <UiTable
          v-model:sorting="sorting"
          v-model:selected="rowSelection"
          :data="rows"
          :columns="columns"
          :page-size="pageSize"
          :row-hover="rowHover"
          :row-clickable="rowClickable"
          :manual-pagination="manualPagination"
          :manual-sorting="manualSorting"
          :enable-sorting="manualSorting"
          :total="total"
          :row-id="rowId"
          :label="label ?? itemLabel"
          :loading="pending"
          :controlled-selection="rowSelectionEnabled"
          bordered
          disable-pagination
          @sort-column="(c: string) => emit('sortColumn', c)"
          @row-click="(r: T) => emit('rowClick', r)"
        />
      </slot>
    </template>

    <!-- Pagination (sibling: applies to the table and any #body view) -->
    <div v-if="showPagination" class="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p class="text-center text-sm text-muted sm:text-left">
        <slot name="pagination-leading">
          <span class="font-medium text-default">{{ totalDisplay }}</span> {{ itemLabel }} total
        </slot>
      </p>
      <UPagination
        v-model:page="page"
        class="self-center sm:self-auto"
        size="sm"
        :items-per-page="pageSize"
        :total="total"
        :sibling-count="1"
        :ui="paginationUi"
      />
    </div>

    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import type { UiTableCellProps } from '../../shared/table'
import { computed } from 'vue'
import { UiIcon } from '#components'
import { uiTableVisibleFromClass } from '../../shared/table'

const {
  align = 'left',
  sortable = false,
  noPadding = false,
  numeric = false,
  sortDirection = false,
  ariaLabel,
  visibleFrom,
} = defineProps<UiTableCellProps & {
  sortable?: boolean
  noPadding?: boolean
  sortDirection?: 'asc' | 'desc' | false
  ariaLabel?: string
}>()

const emit = defineEmits<{ sort: [event: MouseEvent] }>()

const resolvedAlign = computed(() => numeric ? 'right' : align)
const justify = computed(() => resolvedAlign.value === 'right' ? 'justify-end' : resolvedAlign.value === 'center' ? 'justify-center' : 'justify-start')
// Vertical padding lives here, not on the consumer's <tr>. UiTable sets `h-10`
// on its own header row, but this primitive exists for hand-rolled tables where
// there is no such row — without `py-*` a 10px label's line box is the entire
// header height and the text sits jammed against the bottom border.
const padClass = computed(() => noPadding || sortable ? '' : 'px-3 py-2.5')
const sortIcon = computed(() => sortDirection ? 'collapse' : 'sort')
const sortIconClass = computed(() => sortDirection === 'desc' ? 'rotate-180' : '')
</script>

<template>
  <th
    scope="col"
    class="text-label text-left whitespace-nowrap border-b border-default bg-default"
    :class="[padClass, numeric ? 'text-right tabular-nums' : '', visibleFrom ? uiTableVisibleFromClass[visibleFrom] : '']"
    :aria-sort="sortable ? sortDirection === 'asc' ? 'ascending' : sortDirection === 'desc' ? 'descending' : 'none' : undefined"
  >
    <button
      v-if="sortable"
      type="button"
      class="flex min-h-11 w-full items-center gap-1 rounded px-2 py-2.5 text-label text-muted transition-colors hover:text-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-0"
      :class="justify"
      :aria-label="ariaLabel"
      @click="emit('sort', $event)"
    >
      <slot />
      <UiIcon :name="sortIcon" class="size-3 text-dimmed transition-transform duration-150" :class="sortIconClass" aria-hidden="true" />
    </button>
    <div v-else class="flex items-center gap-1" :class="justify">
      <slot />
    </div>
  </th>
</template>

<script setup lang="ts">
import type { UiTableCellProps, UiTableSize } from '../../shared/table'
import { computed } from 'vue'
import { uiTableCellSizeClass, uiTableVisibleFromClass } from '../../shared/table'

const {
  align = 'left',
  size = 'md',
  noPadding = false,
  numeric = false,
  rowHeader = false,
  visibleFrom,
} = defineProps<UiTableCellProps & {
  size?: UiTableSize
  noPadding?: boolean
  rowHeader?: boolean
}>()

const resolvedAlign = computed(() => numeric ? 'right' : align)
const textAlign = computed(() => resolvedAlign.value === 'right' ? 'text-right' : resolvedAlign.value === 'center' ? 'text-center' : 'text-left')
const padClass = computed(() => noPadding ? '' : 'px-3')
</script>

<template>
  <component
    :is="rowHeader ? 'th' : 'td'"
    :scope="rowHeader ? 'row' : undefined"
    class="text-xs font-normal text-default relative"
    :class="[
      uiTableCellSizeClass[size],
      padClass,
      textAlign,
      numeric ? 'tabular-nums' : '',
      visibleFrom ? uiTableVisibleFromClass[visibleFrom] : '',
    ]"
  >
    <slot />
  </component>
</template>

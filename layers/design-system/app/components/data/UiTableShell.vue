<script setup lang="ts">
import type { UiTableSize } from '../../shared/table'
import { UiTableFrame } from '#components'

const {
  size = 'md',
  rowHover = false,
  bordered = false,
  label,
  loading = false,
  tableClass,
} = defineProps<{
  size?: UiTableSize
  /** Enable hover gradient on body rows. */
  rowHover?: boolean
  /** Wrap the table in a bordered/rounded container (use false when caller owns the chrome). */
  bordered?: boolean
  /** Accessible name for the table. Rendered as a visually-hidden <caption>. */
  label: string
  loading?: boolean
  tableClass?: string
}>()
</script>

<template>
  <UiTableFrame
    name="UiTableShell"
    :bordered="bordered"
    :row-hover="rowHover"
    :scroll-label="`${label} table scroll area`"
  >
    <table class="w-full" :class="tableClass" :data-size="size" :aria-busy="loading || undefined">
      <caption v-if="label" class="sr-only">
        {{ label }}
      </caption>
      <thead v-if="$slots.head">
        <tr class="h-10">
          <slot name="head" />
        </tr>
      </thead>
      <tbody>
        <tr class="spacer" aria-hidden="true" />
        <slot />
      </tbody>
      <slot name="tfoot" />
    </table>
  </UiTableFrame>
</template>

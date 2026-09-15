<script setup lang="ts">
import { UiChip, UiTooltip } from '#components'
/**
 * UiOverflowCount — the "+N" pill for "primary values shown + N hidden peers"
 * fields (e.g. a domain header with 5 more aliases). Neutral count chip, no
 * glyph (overflow primitives stay icon-light); the optional tooltip lists the
 * hidden values. Renders nothing when count <= 0.
 *
 * NOT for "N more rows below" list tails (those are a disclosure or a nav link).
 */

const { count, items, size = 'xs' } = defineProps<{
  count: number
  /** The hidden values, listed in a tooltip. */
  items?: string[]
  size?: 'xs' | 'sm'
}>()
</script>

<template>
  <template v-if="count > 0">
    <UiTooltip v-if="items?.length" :text="items.join(', ')">
      <UiChip purpose="count" :size="size" tabular>
        +{{ count }}
      </UiChip>
    </UiTooltip>
    <UiChip v-else purpose="count" :size="size" tabular>
      +{{ count }}
    </UiChip>
  </template>
</template>

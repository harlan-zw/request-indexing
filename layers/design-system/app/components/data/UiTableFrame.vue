<script setup lang="ts">
const {
  name = 'UiTableFrame',
  bordered = false,
  rowHover = false,
  scrolled = false,
  // No default on purpose. `role="region"` is a LANDMARK: several unlabelled
  // tables on one page would each announce the same generic name, which is the
  // exact failure landmark navigation exists to avoid. Unnamed frames fall back
  // to `role="group"`, which stays keyboard-scrollable without polluting the
  // landmark rotor.
  scrollLabel,
} = defineProps<{
  name?: string
  bordered?: boolean
  rowHover?: boolean
  scrolled?: boolean
  scrollLabel?: string
}>()
</script>

<template>
  <div
    :data-ui="name"
    :data-bordered="bordered || undefined"
    :data-row-hover="rowHover || undefined"
    :data-scrolled="scrolled || undefined"
    :aria-label="scrollLabel"
    :role="scrollLabel ? 'region' : 'group'"
    tabindex="0"
    class="w-full overflow-x-auto overscroll-x-contain"
    :class="bordered ? 'rounded-xl border border-default bg-default' : ''"
  >
    <slot />
  </div>
</template>

<style scoped>
:deep(table) {
  width: 100%;
  border-collapse: collapse;
}

:deep(thead) {
  position: sticky;
  inset-block-start: 0;
  z-index: 10;
  background: var(--ui-bg);
}

:deep(thead th) {
  border-block-end: 1px solid var(--ui-border);
  background: var(--ui-bg);
}

:deep(tbody > tr.spacer) {
  block-size: 0.25rem;
}

:deep(tbody > tr.spacer + tr > :is(th, td)) {
  border-block-start: 4px solid transparent;
  background-clip: padding-box;
}

:deep(tbody > tr:not(.spacer):not(:last-child) > :is(th, td)) {
  border-block-end: 1px solid var(--ui-border);
}

[data-row-hover] :deep(tbody > tr:not(.spacer):not(.expanded-row) > :is(th, td)) {
  transition: background-color 140ms ease-out;
}

[data-row-hover] :deep(tbody > tr:not(.spacer):not(.expanded-row):not([data-state='selected']):hover > :is(th, td)),
[data-row-hover] :deep(tbody > tr:not(.spacer):not(.expanded-row):not([data-state='selected']):focus-visible > :is(th, td)) {
  background: var(--ui-bg-muted);
}

[data-row-hover] :deep(tbody > tr:not(.spacer):not(.expanded-row):not([data-state='selected']):hover > :is(th, td):first-child),
[data-row-hover] :deep(tbody > tr:not(.spacer):not(.expanded-row):not([data-state='selected']):focus-visible > :is(th, td):first-child) {
  border-start-start-radius: 0.5rem;
  border-end-start-radius: 0.5rem;
}

[data-row-hover] :deep(tbody > tr:not(.spacer):not(.expanded-row):not([data-state='selected']):hover > :is(th, td):last-child),
[data-row-hover] :deep(tbody > tr:not(.spacer):not(.expanded-row):not([data-state='selected']):focus-visible > :is(th, td):last-child) {
  border-start-end-radius: 0.5rem;
  border-end-end-radius: 0.5rem;
}

[data-row-hover] :deep(tbody > tr.spacer + tr:hover > :is(th, td)),
[data-row-hover] :deep(tbody > tr.spacer + tr:focus-visible > :is(th, td)) {
  background-clip: border-box;
}

/*
 * One continuous selection band: the fill runs the whole row and only its two
 * end cells round, so the row reads as a single shape rather than a strip of
 * separately rounded cells. Same geometry as the hover treatment above, which
 * is what makes hovering a selected row a no-op instead of a shape change.
 */
:deep(tbody > tr[data-state='selected'] > :is(th, td)) {
  background: color-mix(in srgb, var(--ui-primary) 12%, var(--ui-bg));
  border-radius: 0;
}

:deep(tbody > tr[data-state='selected'] > :is(th, td):first-child) {
  border-start-start-radius: 0.5rem;
  border-end-start-radius: 0.5rem;
}

:deep(tbody > tr[data-state='selected'] > :is(th, td):last-child) {
  border-start-end-radius: 0.5rem;
  border-end-end-radius: 0.5rem;
}

:deep(table[data-size='xs'] tbody > tr:not(.spacer):not(.expanded-row) > :is(th, td)) {
  block-size: 2.75rem;
  padding-block: 0.25rem;
}

:deep(table[data-size='sm'] tbody > tr:not(.spacer):not(.expanded-row) > :is(th, td)),
:deep(table[data-size='md'] tbody > tr:not(.spacer):not(.expanded-row) > :is(th, td)) {
  block-size: 2.75rem;
}

[data-scrolled] :deep(thead) {
  box-shadow: var(--elevation-overlay);
}

:deep(thead) {
  transition: box-shadow 200ms ease-out;
}

/*
 * Rows shrink on a PRECISE pointer, not on a wide screen. A tablet is both wide
 * and touched, and in a click-through table the row is the primary target — a
 * 40px row on a touch device is under the 44px floor.
 */
@media (min-width: 40rem) and (pointer: fine) {
  :deep(table[data-size='xs'] tbody > tr:not(.spacer):not(.expanded-row) > :is(th, td)) {
    block-size: 2rem;
  }

  :deep(table[data-size='sm'] tbody > tr:not(.spacer):not(.expanded-row) > :is(th, td)),
  :deep(table[data-size='md'] tbody > tr:not(.spacer):not(.expanded-row) > :is(th, td)) {
    block-size: 2.5rem;
  }
}
</style>

<script setup lang="ts">
/**
 * UiDoorwayGrid — the row that holds `UiDoorwayColumn`s and owns the two rules
 * a page must not have to restate: how many columns actually rendered, and what
 * to do when none of them has anything to say.
 *
 * Both rules are CSS, deliberately. A page gates a column with `v-if`
 * (`allowLiveQueries`, `fullMonitoringAvailable`), and a column only learns it
 * is empty after its query settles — so a JS count would have to be a
 * registration protocol that resolves AFTER the parent's first render, which
 * means a wrong class on the server and a hydration patch on the client.
 * Counting slots is worse still: a slot is "present" even when everything
 * inside it is `v-if`'d away. The selectors below read the DOM, which is the
 * only thing that knows the truth, at the moment it is true.
 *
 * - `:only-child` — a gated-off column leaves a comment placeholder, not an
 *   element, so the surviving column is a genuine only-child and spans the full
 *   width instead of sitting in the left half of a 2-col grid. (Requires each
 *   column to be a single-root component; `UiDoorwayColumn` is.)
 * - `:has(> :not([data-doorway-empty]))` — `UiDoorwayColumn` stamps
 *   `data-doorway-empty` on itself once it has LOADED and has no rows. If no
 *   child lacks that stamp, every column is empty and the whole row hides: a
 *   column stays rendered while its sibling has content (the pair teaches where
 *   activity will appear), but a page with nothing to say does not show two
 *   boxes saying nothing. Pending and error columns are never stamped, so the
 *   row never flickers away while loading.
 */
</script>

<template>
  <div data-doorway-grid class="grid items-start gap-5 md:grid-cols-2">
    <slot />
  </div>
</template>

<style>
/* Deliberately unscoped: these rules are the component's behaviour, and the
   last one has to reach the WRAPPER, which a scope attribute wouldn't match. */

/* The only column left (its sibling gated off) takes the whole width. */
[data-doorway-grid] > *:only-child {
  grid-column: 1 / -1;
}

/* No column has content: the row says nothing, so it isn't drawn. */
[data-doorway-grid]:not(:has(> *:not([data-doorway-empty]))) {
  display: none;
}

/* …and neither is the page zone that exists only to hold it — a hidden row
   would otherwise still spend a section gap on nothing. `:only-child` keeps
   this off a zone that holds other content beside the row. Written as two
   sibling conditions rather than one nested test because `:has()` inside
   `:has()` is invalid and silently drops the whole rule. */
:where(div):has(> [data-doorway-grid]:only-child):not(:has([data-doorway-grid] > *:not([data-doorway-empty]))) {
  display: none;
}
</style>

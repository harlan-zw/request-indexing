<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import { computed } from 'vue'
import { NuxtLink, UiButton, UiIcon, UiSkeleton } from '#components'

/**
 * UiDoorwayColumn — the card shell of a doorway column, extracted from the site
 * overview's Next Actions / Recent Activity pair so a feature page can render
 * the SAME column instead of a look-alike.
 *
 * A doorway names its destination once and stops: the header carries the label
 * and one "View all" link, and the body carries one-line rows. The chrome that
 * Columns sit inside a `UiDoorwayGrid`, which owns the single-column collapse
 * and the hide-the-row-when-every-column-is-empty rule off the
 * `data-doorway-empty` stamp below. Never hand-roll the `md:grid-cols-2` around
 * a pair of columns — that grid is what leaves a gated-off column's half of the
 * page blank.
 *
 * The chrome that
 * does NOT belong here (and is what this shell exists to keep out) is the rail
 * grammar it replaces on feature pages — count chips, context chips, group
 * headings, severity bars, per-row lead-fact lines, age tails, and an "N more"
 * footer. Depth is the owning route's job, which is what the header link is for.
 */
const {
  title,
  viewAllTo = null,
  viewAllLabel = 'View all',
  status = 'success',
  empty = false,
  emptyLabel = null,
  errorLabel = 'Could not load this column.',
  skeletonRows = 4,
} = defineProps<{
  title: string
  /** The owning route this column is a doorway to. Omit to render no link. */
  viewAllTo?: RouteLocationRaw | null
  viewAllLabel?: string
  status?: 'pending' | 'success' | 'error'
  empty?: boolean
  /** Honest empty copy. Rendered only when `empty` and loaded. */
  emptyLabel?: string | null
  errorLabel?: string
  skeletonRows?: number
}>()

const emit = defineEmits<{ retry: [] }>()

/**
 * The stamp `UiDoorwayGrid` reads to decide whether the whole row has anything
 * to say. It means "loaded, and there is nothing here" — never "still loading"
 * and never "failed", both of which are content a reader needs.
 */
const doorwayEmpty = computed(() => (status === 'success' && empty ? '' : undefined))
</script>

<template>
  <section
    class="overflow-hidden rounded-xl border border-default bg-elevated/20"
    :aria-label="title"
    :aria-busy="status === 'pending' ? 'true' : undefined"
    :data-doorway-empty="doorwayEmpty"
  >
    <div class="flex min-h-11 items-center gap-2 border-b border-default/60 px-4">
      <span class="text-label">{{ title }}</span>
      <slot name="header-meta" />
      <NuxtLink
        v-if="viewAllTo"
        :to="viewAllTo"
        class="ml-auto flex min-h-11 items-center text-xs text-muted outline-none transition-colors hover:text-default focus-visible:ring-2 focus-visible:ring-primary sm:min-h-0"
      >
        {{ viewAllLabel }}
      </NuxtLink>
    </div>

    <template v-if="status === 'pending'">
      <span class="sr-only" role="status" aria-live="polite">Loading {{ title }}</span>
      <ul aria-hidden="true" class="divide-y divide-default/60">
        <li v-for="n in skeletonRows" :key="n" class="flex min-w-0 items-center gap-2.5 px-4 py-2">
          <UiSkeleton type="circle" :base="16" :index="n" class="shrink-0" />
          <UiSkeleton type="text" :base="130" :range="90" :index="n" class="!h-3" />
        </li>
      </ul>
    </template>

    <div v-else-if="status === 'error'" class="flex min-h-11 items-center gap-2.5 px-4 py-2" role="alert">
      <UiIcon name="caution" class="size-4 shrink-0 text-error" aria-hidden="true" />
      <p class="min-w-0 flex-1 text-sm text-muted">
        {{ errorLabel }}
      </p>
      <UiButton purpose="secondary" size="xs" icon="refresh" @click="emit('retry')">
        Retry
      </UiButton>
    </div>

    <template v-else-if="empty">
      <slot name="empty">
        <p v-if="emptyLabel" class="px-4 py-3 text-sm text-muted">
          {{ emptyLabel }}
        </p>
      </slot>
    </template>

    <ul v-else class="divide-y divide-default/60">
      <slot />
    </ul>
  </section>
</template>

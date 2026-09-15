<script setup lang="ts">
import { useRoute } from 'nuxt/app'
import { computed } from 'vue'
import { getPath } from '~~/layers/design-system/app/composables/formatting'
import { NuxtLink } from '#components'

// Presentational cell for the keyword table's "Top Page" column. The value is
// resolved in bulk by `useProTopAssociations` (one scan for the whole page),
// so this component just renders the resolved page or a placeholder.
// `pending` is this row's own state: an empty cell that never resolves is the
// bug a shared per-table flag produced.
defineProps<{
  siteId: string
  page: string | null
  pending: boolean
}>()

// `siteId` prop is the UUID; link uses the URL param so it preserves whichever
// id the user is on (publicId `s_…` or uuid).
const linkRoute = useRoute()
const linkSiteId = computed(() => linkRoute.params.id as string)
</script>

<template>
  <!-- `inline-block` is load-bearing. `max-width`, `overflow` and
       `text-overflow` are all ignored on a non-replaced INLINE box, so the cap
       and the `truncate` beside it were inert from the day they were written:
       a deep URL path rendered at its full intrinsic width and starved the
       sibling columns (measured at 1440: this cell 633px wide, no ellipsis,
       Query column squeezed to 86px). With the box made inline-block the cap
       binds, the ellipsis appears, and Query gets ~260px back.
       `align-bottom` pins the baseline of an overflow-hidden inline-block, which
       otherwise adds 0.5px to the row height. Full text stays in the DOM (and in
       `title`), so nothing is lost to a reader or a screen reader. -->
  <NuxtLink
    v-if="page"
    :to="`/pro/dashboard/sites/${linkSiteId}/search-console/pages/${encodeURIComponent(page)}`"
    :title="page"
    class="inline-block max-w-[120px] truncate align-bottom text-sm text-muted hover:text-primary transition-colors"
  >
    {{ getPath(page) }}
  </NuxtLink>
  <span
    v-else-if="pending"
    class="inline-block h-4 w-20 animate-pulse rounded bg-accented align-bottom"
    aria-busy="true"
    aria-label="Loading"
  />
  <span v-else class="text-dimmed">&mdash;</span>
</template>

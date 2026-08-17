<script lang="ts" setup>
import type { Filter } from 'gscdump/query'

// Two different identities. `gscdumpSiteId` ("s_81pdNUNwhTdevC") addresses the
// engine; `routeSlug` ("kv1109") addresses `/dashboard/site/[slug]`. They used
// to arrive as one `siteId` prop, so every row link pointed at a slug the
// router does not know and 404'd. Keep them apart so that cannot recur.
const _props = withDefaults(defineProps<{
  gscdumpSiteId: string
  routeSlug: string
  period?: import('~~/layers/core/app/composables/useGscdump').Period
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
  pagination?: boolean
  excludeColumns?: string[]
  filter?: string
  extraFilters?: Array<Filter<object>>
}>(), {
  pageSize: 10,
  searchable: true,
  sortable: true,
  pagination: true,
})

// `topKeyword` is declared on the row contract but the analytics report this
// table reads never populates it: the top keyword comes from a separate
// per-page association endpoint. The column rendered "-" on every row, so it is
// not shown until a data source exists.
const columns = [
  { key: 'page', label: 'Page', sortable: true },
  { key: 'clicks', label: 'Clicks', sortable: true, class: 'w-20 text-right' },
  { key: 'impressions', label: 'Views', sortable: true, class: 'w-20 text-right' },
  { key: 'position', label: 'Position', sortable: true, class: 'w-20 text-right' },
  { key: 'ctr', label: 'CTR', sortable: true, class: 'w-16 text-right' },
]

// Keep the query string. Dropping it collapsed every row of a query-addressed
// site into one label: `/new-post?id=1` and `/new-post?id=2` both rendered as
// `/new-post`, so distinct pages looked like duplicates (issue #8).
function pageToPath(url?: string) {
  if (!url)
    return ''
  try {
    const { pathname, search } = new URL(url)
    return `${pathname}${search}`
  }
  catch {
    return url
  }
}
</script>

<template>
  <GscdumpTable
    :site-id="gscdumpSiteId"
    dimension="page"
    :period="period"
    :page-size="pageSize"
    :columns="columns"
    :searchable="searchable"
    :sortable="sortable"
    :pagination="pagination"
    :exclude-columns="excludeColumns"
    :extra-filters="extraFilters"
  >
    <template #page-data="{ row }">
      <NuxtLink
        :to="`/dashboard/site/${routeSlug}/pages/${encodeURIComponent(row.page ?? '')}`"
        class="block max-w-[300px] truncate rounded text-xs text-default transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :title="row.page"
      >
        {{ pageToPath(row.page) }}
      </NuxtLink>
    </template>
    <template #clicks-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ useHumanFriendlyNumber(row.clicks) }}
        <TrendPercentage v-if="row.prevClicks !== undefined" compact :value="row.clicks" :prev-value="row.prevClicks" />
      </div>
    </template>
    <template #impressions-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ useHumanFriendlyNumber(row.impressions) }}
      </div>
    </template>
    <template #position-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ useHumanFriendlyNumber(row.position, 1) }}
        <TrendPercentage v-if="row.prevPosition !== undefined" compact negative :value="row.position" :prev-value="row.prevPosition" />
      </div>
    </template>
    <template #ctr-data="{ row }">
      <div class="text-right font-mono text-xs tabular-nums">
        {{ formatPercentMetric(row.ctr * 100) }}
      </div>
    </template>
  </GscdumpTable>
</template>

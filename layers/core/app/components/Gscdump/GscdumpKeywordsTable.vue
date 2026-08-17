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
  extraFilters?: Array<Filter<object>>
}>(), {
  pageSize: 10,
  searchable: true,
  sortable: true,
  pagination: true,
})

// `topPage` and `searchVolume` are declared on the row contract but the
// analytics report this table reads never populates them: the top page comes
// from a separate per-keyword association endpoint and search volume from
// keyword enrichment. Both columns rendered "-" on every row of every page, so
// they are not shown until a data source exists.
const columns = [
  { key: 'query', label: 'Keyword', sortable: true },
  { key: 'clicks', label: 'Clicks', sortable: true, class: 'w-20 text-right' },
  { key: 'impressions', label: 'Views', sortable: true, class: 'w-20 text-right' },
  { key: 'position', label: 'Position', sortable: true, class: 'w-20 text-right' },
  { key: 'ctr', label: 'CTR', sortable: true, class: 'w-16 text-right' },
]
</script>

<template>
  <GscdumpTable
    :site-id="gscdumpSiteId"
    dimension="query"
    :period="period"
    :page-size="pageSize"
    :columns="columns"
    :searchable="searchable"
    :sortable="sortable"
    :pagination="pagination"
    :exclude-columns="excludeColumns"
    :extra-filters="extraFilters"
  >
    <template #query-data="{ row }">
      <UiTooltip :text="row.query" size="lg">
        <NuxtLink
          :to="`/dashboard/site/${routeSlug}/keywords/${encodeURIComponent(row.query ?? '')}`"
          class="block max-w-[250px] truncate rounded text-xs text-default transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          :title="row.query"
        >
          {{ row.query }}
        </NuxtLink>
      </UiTooltip>
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

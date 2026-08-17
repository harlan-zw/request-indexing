<script lang="ts" setup>
import type { Filter } from 'gscdump/query'
import countries from '#layers/core/shared/shared/data/countries'

const _props = withDefaults(defineProps<{
  siteId: string
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

const columns = [
  { key: 'country', label: 'Country', sortable: true },
  { key: 'clicks', label: 'Clicks', sortable: true, class: 'w-20 text-right' },
  { key: 'impressions', label: 'Views', sortable: true, class: 'w-20 text-right' },
  { key: 'position', label: 'Position', sortable: true, class: 'w-20 text-right' },
  { key: 'ctr', label: 'CTR', sortable: true, class: 'w-16 text-right' },
]

// Search Console reports ISO 3166-1 alpha-3 in lower case ("aus"), the dataset
// keys them in upper case ("AUS"). The lookup missed every row, so the table
// fell back to printing the raw code with no name and no flag.
const alpha3ToCountry = new Map(countries.map(c => [c['alpha-3'].toUpperCase(), c]))

function lookup(code?: string) {
  if (!code)
    return undefined
  return alpha3ToCountry.get(code.toUpperCase())
}

function countryName(code?: string) {
  if (!code)
    return 'Unknown region'
  return lookup(code)?.name ?? `Unknown region (${code.toUpperCase()})`
}

function countryFlag(code?: string) {
  const country = lookup(code)
  if (!country)
    return ''
  return `i-circle-flags-${country['alpha-2'].toLowerCase()}`
}
</script>

<template>
  <GscdumpTable
    :site-id="siteId"
    dimension="country"
    :period="period"
    :page-size="pageSize"
    :columns="columns"
    :searchable="searchable"
    :sortable="sortable"
    :pagination="pagination"
    :exclude-columns="excludeColumns"
    :extra-filters="extraFilters"
  >
    <template #country-data="{ row }">
      <div class="flex items-center gap-2 text-xs">
        <UIcon v-if="countryFlag(row.country)" :name="countryFlag(row.country)" class="size-4 shrink-0" />
        <UIcon v-else name="i-lucide-globe" class="size-4 shrink-0 text-dimmed" />
        <span class="truncate">{{ countryName(row.country) }}</span>
      </div>
    </template>
    <!-- Ten of twelve rows carried no delta, so the column read as broken. A row
         with no previous-period value now says so instead of rendering nothing. -->
    <template #clicks-data="{ row, tableData }">
      <div class="flex items-center justify-end gap-1 text-right font-mono text-xs tabular-nums">
        {{ useHumanFriendlyNumber(row.clicks) }}
        <TrendPercentage v-if="row.prevClicks !== undefined" compact :value="row.clicks" :prev-value="row.prevClicks" />
        <UiTooltip v-else :text="tableData.data.value.hasPrevData ? 'No clicks in the previous period' : 'The previous period is outside the synced range'">
          <UIcon name="i-lucide-minus" class="size-3 text-dimmed" />
        </UiTooltip>
      </div>
    </template>
    <template #impressions-data="{ row }">
      <div class="text-right font-mono text-xs tabular-nums">
        {{ useHumanFriendlyNumber(row.impressions) }}
      </div>
    </template>
    <template #position-data="{ row }">
      <div class="text-right font-mono text-xs tabular-nums">
        {{ useHumanFriendlyNumber(row.position, 1) }}
      </div>
    </template>
    <template #ctr-data="{ row }">
      <div class="text-right font-mono text-xs tabular-nums">
        {{ formatPercentMetric(row.ctr * 100) }}
      </div>
    </template>
  </GscdumpTable>
</template>

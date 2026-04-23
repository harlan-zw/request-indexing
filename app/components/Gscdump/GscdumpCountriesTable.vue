<script lang="ts" setup>
import countries from '#shared/data/countries'

const props = withDefaults(defineProps<{
  siteId: string
  period?: import('~/composables/useGscdump').Period
  pageSize?: number
  searchable?: boolean
  sortable?: boolean
  pagination?: boolean
  excludeColumns?: string[]
  extraFilters?: Array<{ type: string, column: string, value: string }>
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

const alpha3ToCountry = new Map(countries.map(c => [c['alpha-3'], c]))

function countryName(code: string) {
  return alpha3ToCountry.get(code)?.name || code
}

function countryFlag(code: string) {
  const c = alpha3ToCountry.get(code)
  if (!c)
    return ''
  return `i-circle-flags-${c['alpha-2'].toLowerCase()}`
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
        <UIcon v-if="countryFlag(row.country)" :name="countryFlag(row.country)" class="w-4 h-4" />
        <span>{{ countryName(row.country) }}</span>
      </div>
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
      </div>
    </template>
    <template #ctr-data="{ row }">
      <div class="text-right font-mono text-xs">
        {{ useHumanFriendlyNumber(row.ctr * 100, 1) }}%
      </div>
    </template>
  </GscdumpTable>
</template>

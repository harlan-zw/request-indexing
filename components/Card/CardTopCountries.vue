<script lang="ts" setup>
const props = defineProps<{ countries: { period: any[], prevPeriod: any[] } }>()

const { countries } = toRefs(props)
const clicksSum = computed(() => {
  if (!countries.value?.period)
    return 0
  return countries.value.period.reduce((acc, country) => acc + (country.clicks || 0), 0)
})

const prevClicksSum = computed(() => {
  if (!countries.value?.prevPeriod)
    return 0
  return countries.value.prevPeriod.reduce((acc, country) => acc + country.clicks || 0, 0)
})

const rows = computed(() => {
  return (countries.value?.period || []).map((r) => {
    const prevPeriod = countries.value.prevPeriod?.find(p => p.country === r.country)

    const prev = Number((prevPeriod?.clicks || 0) / prevClicksSum.value * 100)
    const current = Number(r.clicks / clicksSum.value * 100)
    let percent
    if (prev === 0)
      percent = 0
    else
      percent = (current - prev) / ((prev + current) / 2)
    return {
      ...r,
      clicksPercent: current,
      prevPeriodClicksPercent: prev,
      percent,
    }
  })
})
</script>

<template>
  <UCard>
    <template #header>
      <div class="font-bold flex items-center gap-2">
        <UIcon name="i-heroicons-globe-americas" /> Countries
      </div>
    </template>
    <div class="space-y-5">
      <TableData :value="rows" :columns="[{ label: 'Country', key: 'country' }, { label: 'Clicks', sortable: true, key: 'clicksPercent' }, { label: '%', key: 'percent', sortable: true }, { label: 'Keywords', key: 'keywords' }]">
        <template #country-data="{ row }">
          <ProgressPercent :value="row.clicks" :total="clicksSum">
            <div class="flex items-center gap-2">
              <Icon :name="`circle-flags:${row.countryCode.toLowerCase()}`" />
              <span class=" capitalize">{{ row.country }}</span>
              <div>{{ useHumanFriendlyNumber(row.clicks / clicksSum * 100) }}%</div>
            </div>
          </ProgressPercent>
        </template>
        <template #clicksPercent-data="{ row }">
          {{ useHumanFriendlyNumber(row.clicksPercent) }}%
        </template>
        <template #percent-data="{ row }">
          <TrendPercentage symbol="%" :value="row.clicksPercent" :prev-value="row.prevPeriodClicksPercent" />
        </template>
      </TableData>
    </div>
  </UCard>
</template>

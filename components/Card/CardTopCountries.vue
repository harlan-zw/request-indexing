<script lang="ts" setup>
defineProps<{ rows: any[] }>()

// const { countries } = toRefs(props)
// const clicksSum = computed(() => {
//   if (!countries.value?.period)
//     return 0
//   return countries.value.period.reduce((acc, country) => acc + (country.clicks || 0), 0)
// })
//
// const prevClicksSum = computed(() => {
//   if (!countries.value?.prevPeriod)
//     return 0
//   return countries.value.prevPeriod.reduce((acc, country) => acc + country.clicks || 0, 0)
// })
//
// const rows = computed(() => {
//   return (countries.value?.period || []).map((r) => {
//     const prevPeriod = countries.value.prevPeriod?.find(p => p.country === r.country)
//
//     const prev = Number((prevPeriod?.clicks || 0) / prevClicksSum.value * 100)
//     const current = Number(r.clicks / clicksSum.value * 100)
//     let percent
//     if (prev === 0)
//       percent = 0
//     else
//       percent = (current - prev) / ((prev + current) / 2)
//     return {
//       ...r,
//       clicksPercent: current,
//       prevPeriodClicksPercent: prev,
//       percent,
//     }
//   })
// })

const columns = [{ label: 'Country', key: 'country' }, { label: '%', sortable: true, key: 'percent' }]
</script>

<template>
  <div>
    <div class="flex items-center text-sm gap-1 mb-2">
      <UIcon name="i-heroicons-globe-americas" /> Top Countries
    </div>
    <UCard>
      <TableData :searchable="false" :value="rows" :columns="columns" :filters="[]">
        <template #country-data="{ row }">
          <div class="flex-1 flex-grow min-h-full">
            <ProgressPercent :value="row.percent" :total="100" class="min-w-full">
              <div class="flex items-center gap-2 mb-1">
                <Icon :name="`circle-flags:${row.countryCode.toLowerCase()}`" />
                <span class=" capitalize">{{ row.country }}</span>
              <!--            <div>{{ useHumanFriendlyNumber(row.clicks / clicksSum * 100) }}%</div> -->
              </div>
            </ProgressPercent>
          </div>
        </template>
        <template #clicksPercent-data="{ row }">
          {{ useHumanFriendlyNumber(row.clicksPercent) }}%
        </template>
        <template #percent-data="{ row }">
          {{ useHumanFriendlyNumber(row.percent) }}%
          <TrendPercentage symbol="%" :value="row.percent" :prev-value="row.prevPeriodClicksPercent" />
        </template>
      </TableData>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ devices: { period: any[], prevPeriod: any[] } }>()

const { devices } = toRefs(props)

const clicksSum = computed(() => {
  if (!devices?.value?.period)
    return 0
  return devices.value.period.reduce((acc, device) => acc + device.clicks, 0)
})
const prevClicksSum = computed(() => {
  if (!devices?.value?.prevPeriod)
    return 0
  return devices.value.prevPeriod.reduce((acc, device) => acc + device.clicks || 0, 0)
})

const rows = computed(() => {
  return (devices.value?.period || []).map((r) => {
    const prevPeriod = devices.value.prevPeriod?.find(p => p.country === r.country)

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
  <div>
    <div class="font-bold flex items-center gap-1 mb-2">
      <UIcon name="i-ph-devices" /> Traffic by device
    </div>
    <TableData :searchable="false" :value="rows" :columns="[{ label: 'Device', key: 'device' }, { label: 'Clicks', sortable: true, key: 'clicksPercent' }, { label: '%', key: 'percent', sortable: true }, { label: 'Keywords', key: 'keywords' }]">
      <template #device-data="{ row }">
        <ProgressPercent :value="row.clicks" :total="clicksSum">
          <div class="flex items-center gap-1">
            <UIcon v-if="row.device === 'TABLET'" name="i-heroicons-device-tablet" class="w-4 h-4" />
            <UIcon v-else :name="row.device === 'DESKTOP' ? 'i-heroicons-computer-desktop' : 'i-heroicons-device-phone-mobile' " class="w-4 h-4" />
            <span class="text-sm text-gray-600 capitalize">{{ row.device.toLowerCase() }}</span>
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
</template>

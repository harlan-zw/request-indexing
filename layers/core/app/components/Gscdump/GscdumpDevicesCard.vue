<script lang="ts" setup>
const props = defineProps<{
  siteId: string
  period?: import('~~/layers/core/app/composables/useGscdump').Period
}>()

const { period: dashboardPeriod } = useDashboardPeriod()
const activePeriod = computed(() => props.period || dashboardPeriod.value)

const tableData = useGscdumpTableData({
  siteId: () => props.siteId,
  dimension: 'device',
  period: activePeriod,
  pageSize: 10,
})

const totalClicks = computed(() =>
  tableData.rows.value.reduce((sum, r) => sum + (r.clicks || 0), 0),
)

const deviceIcon = {
  MOBILE: 'i-heroicons-device-phone-mobile',
  DESKTOP: 'i-heroicons-computer-desktop',
  TABLET: 'i-heroicons-device-tablet',
} as Record<string, string>

function iconForDevice(device?: string) {
  return deviceIcon[device?.toUpperCase() ?? '']
}

// Every bar drew at the same length whatever the split was, so the card said
// "Desktop 100% / Mobile 0%" over three identical bars. The width now carries
// the value and the fill uses the app palette instead of a stock blue.
const devices = computed(() => tableData.rows.value
  .map((row) => {
    const clicks = row.clicks || 0
    const share = totalClicks.value ? (clicks / totalClicks.value) * 100 : 0
    return {
      device: row.device ?? 'Unknown',
      icon: iconForDevice(row.device),
      clicks,
      impressions: row.impressions || 0,
      share,
    }
  })
  // "Tablet 0%" told the reader nothing except that the row existed.
  .filter(row => row.clicks > 0)
  .sort((a, b) => b.clicks - a.clicks))

const hiddenDevices = computed(() => tableData.rows.value.length - devices.value.length)

const status = computed<'pending' | 'error' | 'success'>(() => {
  if (tableData.isLoading.value)
    return 'pending'
  if (tableData.error.value)
    return 'error'
  return 'success'
})
</script>

<template>
  <AsyncCardState
    :status="status"
    :error="tableData.error.value"
    :error-message="tableData.error.value?.message"
    :empty="!devices.length"
    label="device breakdown"
    empty-message="No device data for this period."
    min-height="min-h-24"
    :rows="3"
    @retry="tableData.refresh()"
  >
    <div class="space-y-3">
      <div v-for="row in devices" :key="row.device">
        <div class="flex items-center justify-between gap-2 text-xs">
          <span class="flex items-center gap-1 text-muted">
            <UIcon v-if="row.icon" :name="row.icon" class="w-4 h-4" />
            <span class="capitalize">{{ row.device.toLowerCase() }}</span>
          </span>
          <span class="font-mono tabular-nums text-highlighted">
            {{ useHumanFriendlyNumber(row.share, 0) }}%
          </span>
        </div>
        <UTooltip :text="`${useHumanFriendlyNumber(row.impressions)} views`" class="block w-full">
          <div
            class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-elevated"
            role="img"
            :aria-label="`${row.device.toLowerCase()}: ${useHumanFriendlyNumber(row.share, 0)}% of clicks`"
          >
            <div class="h-full rounded-full bg-primary transition-[width]" :style="{ width: `${Math.max(row.share, 2)}%` }" />
          </div>
        </UTooltip>
        <div class="mt-1 text-xs text-muted tabular-nums">
          {{ useHumanFriendlyNumber(row.clicks) }} clicks
        </div>
      </div>
      <p v-if="hiddenDevices > 0" class="text-xs text-dimmed">
        {{ hiddenDevices }} device {{ hiddenDevices === 1 ? 'type' : 'types' }} had no clicks.
      </p>
    </div>
  </AsyncCardState>
</template>

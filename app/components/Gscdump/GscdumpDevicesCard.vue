<script lang="ts" setup>
const props = defineProps<{
  siteId: string
  period?: import('~/composables/useGscdump').Period
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
</script>

<template>
  <div v-if="tableData.isLoading.value" class="flex items-center justify-center py-4">
    <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin text-gray-400" />
  </div>
  <div v-else-if="tableData.rows.value.length" class="space-y-3">
    <div v-for="row in tableData.rows.value" :key="row.device">
      <div class="flex items-center gap-1 text-sm">
        <UIcon v-if="deviceIcon[row.device?.toUpperCase()]" :name="deviceIcon[row.device?.toUpperCase()]" class="w-4 h-4 text-gray-500" />
        <span class="capitalize text-xs text-gray-500">{{ row.device?.toLowerCase() }}</span>
      </div>
      <div class="text-lg font-mono">
        <ProgressPercent :value="row.clicks" :total="totalClicks">
          {{ useHumanFriendlyNumber(totalClicks ? row.clicks / totalClicks * 100 : 0, 0) }}%
        </ProgressPercent>
      </div>
    </div>
  </div>
  <div v-else class="text-sm text-gray-600">
    No data yet, check back soon.
  </div>
</template>

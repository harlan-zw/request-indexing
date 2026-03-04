<script lang="ts" setup>
import type { Period } from '~/composables/useGscdump'

const { period, setPeriod, periodLabel } = useDashboardPeriod()

const periodItems: Array<{ label: string, value: Period }> = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 28 days', value: '28d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last 12 months', value: '12m' },
]
</script>

<template>
  <UPopover :popper="{ placement: 'bottom-end' }">
    <template #default="{ open }">
      <UButton size="xs" color="neutral" icon="i-ph-calendar-dots-duotone" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid">
        {{ periodLabel }}
      </UButton>
    </template>

    <template #panel="{ close }">
      <div class="flex flex-col p-1">
        <UButton
          v-for="item in periodItems"
          :key="item.value"
          :label="item.label"
          color="neutral"
          size="xs"
          variant="ghost"
          class="rounded-none px-2"
          :trailing-icon="item.value === period ? 'i-heroicons-check-circle' : ''"
          :class="[item.value === period ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
          @click="setPeriod(item.value); close()"
        />
      </div>
    </template>
  </UPopover>
</template>

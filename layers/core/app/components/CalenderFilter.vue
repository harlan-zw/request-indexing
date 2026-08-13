<script lang="ts" setup>
import type { Period } from '~~/layers/core/app/composables/useGscdump'

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
  <UPopover :content="{ side: 'bottom', align: 'start' }">
    <template #default="{ open }">
      <UButton
        size="sm"
        color="neutral"
        icon="i-ph-calendar-dots-duotone"
        variant="outline"
        class="min-h-10 border-dashed"
        :class="open && 'bg-muted'"
        trailing-icon="i-heroicons-chevron-down-20-solid"
      >
        {{ periodLabel }}
      </UButton>
    </template>

    <template #content="{ close }">
      <div class="flex min-w-48 flex-col p-1">
        <UButton
          v-for="item in periodItems"
          :key="item.value"
          :label="item.label"
          color="neutral"
          size="sm"
          variant="ghost"
          class="min-h-11 justify-between px-2"
          :trailing-icon="item.value === period ? 'i-heroicons-check-circle' : ''"
          :class="item.value === period ? 'bg-muted' : 'hover:bg-muted'"
          @click="setPeriod(item.value); close()"
        />
      </div>
    </template>
  </UPopover>
</template>

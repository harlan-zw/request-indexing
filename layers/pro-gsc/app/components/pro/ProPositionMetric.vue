<script lang="ts" setup>
const { value } = defineProps<{ value: number | string, size?: string }>()

const val = Number(value)

const color = computed(() => {
  if (val < 10)
    return 'success'
  if (val < 20)
    return 'warning'
  if (val < 30)
    return 'warning'
  return 'error'
})

const formattedValue = computed(() => Math.round(val))
</script>

<template>
  <UiTooltip>
    <UBadge :color="color" variant="subtle" class="font-mono tabular-nums">
      {{ formattedValue }}
    </UBadge>
    <template #text>
      <div class="max-w-xs text-xs">
        <p class="font-medium mb-1">
          Avg Position: {{ val.toFixed(1) }}
        </p>
        <p class="text-muted">
          Weighted average across all impressions (countries, devices, personalization). May differ from single SERP checks.
        </p>
      </div>
    </template>
  </UiTooltip>
</template>

<script lang="ts" setup>
const props = defineProps<{
  prevValue?: string | number | null
  value: string | number
  symbol?: string
  negative?: boolean
  compact?: boolean
}>()

const percentage = computed(() => calcTrendPercent(Number(props.value), Number(props.prevValue)))
</script>

<template>
  <UTooltip v-if="prevValue" :text="`${useHumanFriendlyNumber(Number(prevValue))}${symbol || ''} previous period`">
    <UiTrend :value="percentage" :inverted="negative" size="sm" />
  </UTooltip>
</template>

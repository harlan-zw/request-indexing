<script lang="ts" setup>
const props = defineProps<{
  prevValue?: string | number | null
  value: string | number
  symbol?: string
  /** Metric where a lower number is better, such as search position. */
  negative?: boolean
  compact?: boolean
}>()

// Raw change only. UiTrend applies `negative` when it derives arrow, sign and
// colour, so inverting here as well would flip the sign against the arrow.
const percentage = computed(() => calcTrendPercent(Number(props.value), Number(props.prevValue)))
</script>

<template>
  <UTooltip v-if="prevValue" :text="`${useHumanFriendlyNumber(Number(prevValue))}${symbol || ''} previous period`">
    <UiTrend :value="percentage" :inverted="negative" size="sm" />
  </UTooltip>
</template>

<script lang="ts" setup>
const props = defineProps<{
  prevValue?: string | number | null
  value: string | number
  symbol?: string
  negative?: boolean
}>()

const percentage = computed(() => {
  const prev = Number(props.prevValue)
  const current = Number(props.value)
  if (prev === 0)
    return 1
  return (current - prev) / ((prev + current) / 2)
})
</script>

<template>
  <UTooltip v-if="prevValue" :text="`${useHumanFriendlyNumber(Number(prevValue))}${symbol || ''} previous period`">
    <div v-if="percentage > 0 && !negative" class="text-sm items-center flex gap-1 text-green-500">
      <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 opacity-70" />
      <div>{{ useHumanFriendlyNumber(Math.round(percentage * 100)) }}%</div>
    </div>
    <div v-else class="text-sm  items-center flex gap-1 text-red-500">
      <UIcon name="i-heroicons-arrow-trending-down" class="w-4 h-4 opacity-70" />
      <div>{{ useHumanFriendlyNumber(Math.round(percentage * 100)) }}%</div>
    </div>
  </UTooltip>
</template>

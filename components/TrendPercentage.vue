<script lang="ts" setup>
const props = defineProps<{
  prevValue: string | number
  value: string | number
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
  <UTooltip :text="`${useHumanFriendlyNumber(Number(prevValue))} previous period`">
    <div v-if="!prevValue">
      0%
    </div>
    <div v-else-if="percentage > 0" class="text-sm items-center flex gap-1 text-green-500">
      <UIcon name="i-heroicons-arrow-trending-up" class="w-4 h-4 opacity-70" />
      <div>{{ useHumanFriendlyNumber(Math.round(percentage * 100)) }}%</div>
    </div>
    <div v-else class="text-sm  items-center flex gap-1 text-red-500">
      <UIcon name="i-heroicons-arrow-trending-down" class="w-4 h-4 opacity-70" />
      <div>{{ useHumanFriendlyNumber(Math.round(percentage * 100)) }}%</div>
    </div>
  </UTooltip>
</template>

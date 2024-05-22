<script lang="ts" setup>
const props = defineProps<{
  prevValue?: string | number | null
  value: string | number
  symbol?: string
  negative?: boolean
  compact?: boolean
}>()

const percentage = computed(() => {
  const prev = Number(props.prevValue)
  const current = Number(props.value)
  if (prev === 0)
    return 1
  const mod = props.negative ? -1 : 1
  return (current - prev) / ((prev + current) / 2) * mod
})

const isSame = computed(() => {
  return Number(props.prevValue) === Number(props.value)
})
</script>

<template>
  <UTooltip v-if="prevValue" :text="`${useHumanFriendlyNumber(Number(prevValue))}${symbol || ''} previous period`">
    <div v-if="isSame">
      <div class="text-xs opacity-50">
        ─
      </div>
    </div>
    <div v-else-if="percentage > 0" class="text-xs items-center flex gap-1 text-green-500">
      <UIcon v-if="!compact" name="i-heroicons-arrow-trending-up" class="w-4 h-4 opacity-70" />
      <div>{{ useHumanFriendlyNumber(Math.round(percentage * 100)) }}<span class="text-[10px]">%</span></div>
    </div>
    <div v-else class="text-xs  items-center flex gap-1 text-red-500">
      <UIcon v-if="!compact" name="i-heroicons-arrow-trending-down" class="w-4 h-4 opacity-70" />
      <div>{{ useHumanFriendlyNumber(Math.round(percentage * 100)) }}<span class="text-[10px]">%</span></div>
    </div>
  </UTooltip>
</template>

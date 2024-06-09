<script lang="ts" setup>
const props = defineProps<{
  total: string | number
  value: string | number
  tooltip?: string
}>()

const percentage = computed(() => {
  return (Number(props.value) / Number(props.total || 100)) * 100
})
</script>

<template>
  <UTooltip :text="tooltip || `${value}/${total || 100} - ${useHumanFriendlyNumber(percentage)}%`" class="block w-full">
    <slot />
    <UProgress :value="percentage" color="blue" class="opacity-50" size="xs" v-bind="$attrs" />
  </UTooltip>
</template>

<script lang="ts" setup>
type ProgressColor = 'error' | 'info' | 'success' | 'primary' | 'secondary' | 'warning' | 'neutral'

const props = withDefaults(defineProps<{
  total?: string | number
  value: string | number
  tooltip?: string
  color?: ProgressColor
}>(), {
  color: 'info',
})

const percentage = computed(() => {
  return (Number(props.value) / Number(props.total || 100)) * 100
})
</script>

<template>
  <UTooltip :text="tooltip || `${useHumanFriendlyNumber(percentage)}% of clicks`" class="block w-full">
    <slot />
    <UProgress :model-value="percentage" :color="color" class="opacity-90" size="xs" v-bind="$attrs" />
  </UTooltip>
</template>

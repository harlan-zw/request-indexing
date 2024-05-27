<script lang="ts" setup>
const props = defineProps<{
  total: string | number
  value: string | number
}>()

const percentage = computed(() => {
  return (Number(props.value) / Number(props.total)) * 100
})
</script>

<template>
  <UTooltip :text="`${value}/${total} - ${useHumanFriendlyNumber(percentage)}%`" class="block w-full">
    <div class="mb-2">
      <slot />
    </div>
    <UProgress :value="percentage" color="blue" class="opacity-60" size="sm" v-bind="$attrs" />
  </UTooltip>
</template>

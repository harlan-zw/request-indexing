<script lang="ts" setup>
import { useHumanMsRaw } from '~/composables/formatting'

const props = defineProps<{
  value: number
  unitless?: boolean
}>()

const unit = computed(() => {
  if (!props.unitless) {
    if (props.value < 1000)
      return 'ms'
    if (props.value < 10000)
      return 's'
    return 'min'
  }
  return ''
})
</script>

<template>
  <UTooltip :text="`${value}ms this period`" class="flex items-center gap-1">
    <span class="font-mono text-sm" v-bind="$attrs">{{ !value ? 0 : (!unitless ? useHumanMsRaw(value) : useHumanFriendlyNumber(value)) }}</span><span v-if="unit" class="text-xs">{{ unit }}</span>
  </UTooltip>
</template>

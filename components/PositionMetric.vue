<script lang="ts" setup>
const props = defineProps<{ value: number }>()
// we're showing the Position metric from Google Search Console, we want to
// alter the colour depending on the position of the keyword
const color = computed(() => {
  if (props.value < 10)
    return 'green'
  if (props.value < 20)
    return 'amber'
  if (props.value < 30)
    return 'orange'
  return 'red'
})
// we should show the value without decimals
const formattedValue = computed(() => Math.round(props.value))

// it should be shown in a badge with minimal padding
</script>

<template>
  <UTooltip :text="`Average position of ${useHumanFriendlyNumber(value)}.`">
    <UBadge size="lg" :color="color" variant="soft" class="px-2 py-1">
      {{ formattedValue }}
    </UBadge>
  </UTooltip>
</template>

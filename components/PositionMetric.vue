<script lang="ts" setup>
const props = defineProps<{ value: number | string }>()

const val = Number(props.value)
// we're showing the Position metric from Google Search Console, we want to
// alter the colour depending on the position of the keyword
const color = computed(() => {
  if (val < 10)
    return 'green'
  if (val < 20)
    return 'amber'
  if (val < 30)
    return 'orange'
  return 'red'
})
// we should show the value without decimals
const formattedValue = computed(() => Math.round(val))
// it should be shown in a badge with minimal padding
</script>

<template>
  <UTooltip :text="`Average position of ${useHumanFriendlyNumber(value)}.`">
    <UBadge size="lg" :color="color" variant="soft" class="px-2 py-1">
      {{ formattedValue }}
    </UBadge>
  </UTooltip>
</template>

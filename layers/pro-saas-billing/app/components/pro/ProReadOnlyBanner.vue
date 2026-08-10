<script setup lang="ts">
const { daysRemaining } = defineProps<{
  readOnlyUntil: Date
  daysRemaining: number
}>()

const emit = defineEmits<{ openPortal: [] }>()

const description = computed(() => {
  const d = Math.max(0, daysRemaining)
  if (d === 0)
    return 'Your account archives today. Reactivate to keep your reports active.'
  return `${d} ${d === 1 ? 'day' : 'days'} before archive.`
})
</script>

<template>
  <ProAlert
    color="warning"
    icon="i-lucide-eye"
    title="You can still view your reports. Subscribe to add sites and resume tracking."
    :description="description"
    :dismissible="false"
  >
    <template #action>
      <UButton
        size="xs"
        color="primary"
        variant="solid"
        trailing-icon="i-lucide-arrow-right"
        @click="emit('openPortal')"
      >
        Reactivate plan
      </UButton>
    </template>
  </ProAlert>
</template>

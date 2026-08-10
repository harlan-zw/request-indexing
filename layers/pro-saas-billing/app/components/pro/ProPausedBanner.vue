<script setup lang="ts">
const emit = defineEmits<{ openPortal: [] }>()
</script>

<template>
  <ProAlert
    color="warning"
    icon="i-lucide-pause-circle"
    title="Your trial ended without a payment method."
    description="Add a card to resume tracking. View-only mode active for 24 hours before sites pause."
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
        Add payment method
      </UButton>
    </template>
  </ProAlert>
</template>

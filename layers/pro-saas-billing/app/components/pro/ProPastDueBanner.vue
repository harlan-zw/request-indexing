<script setup lang="ts">
const emit = defineEmits<{ openPortal: [] }>()
</script>

<template>
  <ProAlert
    color="warning"
    icon="i-lucide-credit-card"
    title="Payment failed. Update your card to keep your subscription."
    description="Stripe is retrying automatically. You retain full access during the retry window."
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
        Update card
      </UButton>
    </template>
  </ProAlert>
</template>

<script lang="ts" setup>
defineProps<{
  variant?: 'full' | 'compact'
}>()
</script>

<template>
  <ProAlert
    color="warning"
    icon="i-lucide-key-round"
    title="Indexing API permission required"
    :description="variant !== 'compact' ? 'Grant permission to submit URLs for indexing directly to Google.' : undefined"
  >
    <template #action>
      <UiMotionButton
        to="/auth/integrations/gsc/connect?scope=full"
        external
        size="xs"
        color="neutral"
        variant="subtle"
        trailing-icon="i-lucide-arrow-right"
      >
        Grant
      </UiMotionButton>
    </template>
  </ProAlert>
</template>

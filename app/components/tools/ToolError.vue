<script setup lang="ts">
defineProps<{
  error: string | null
}>()
</script>

<template>
  <UAlert
    v-if="error"
    color="error"
    variant="subtle"
    icon="i-heroicons-exclamation-circle"
    class="mb-6"
  >
    <template #title>
      {{ error }}
    </template>
  </UAlert>
</template>

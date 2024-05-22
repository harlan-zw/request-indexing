<script lang="ts" setup>
defineProps<{
  title: string
  icon: string
  description: string
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <div class="text-lg font-semibold flex items-center gap-1 text-gray-900">
      <UIcon :name="icon" />
      <div>{{ title }}</div>
    </div>
  </div>
</template>

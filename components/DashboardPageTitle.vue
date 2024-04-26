<script lang="ts" setup>
defineProps<{
  title: string
  icon: string
  description: string
}>()
</script>

<template>
  <div class="mb-7">
    <div class="text-2xl mb-1 font-bold flex items-center gap-2 text-gray-900">
      <UIcon :name="icon" />
      <div>{{ title }}</div>
    </div>
    <div class="text-gray-500 text-sm">
      {{ description }}
    </div>
    <UDivider class="py-5" />
  </div>
</template>

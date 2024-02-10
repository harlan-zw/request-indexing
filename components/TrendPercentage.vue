<script lang="ts" setup>
defineProps<{
  value: string | number
}>()
</script>

<template>
  <div v-if="value === 0">
    <span>0%</span>
  </div>
  <div v-else-if="value > 0" class="text-sm flex gap-2 text-green-500">
    <UIcon name="i-heroicons-arrow-trending-up" class="w-5 h-5 " />
    <span>{{ Math.round(value * 100) }}%</span>
  </div>
  <div v-else class="text-sm flex items-end gap-2 text-red-500">
    <UIcon name="i-heroicons-arrow-trending-down" class="w-5 h-5 " />
    <span>{{ Math.round(value * 100) }}%</span>
  </div>
</template>

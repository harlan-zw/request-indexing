<script lang="ts" setup>
const props = defineProps<{
  value: number
  fast: number
  moderate: number
}>()
</script>

<template>
  <div class="w-12">
    <UProgress v-if="value <= fast" :value="fast - value" :max="fast" color="success" size="sm" />
    <UProgress v-else-if="value < moderate" :value="value - fast" :max="moderate - fast" color="warning" size="sm" />
    <UProgress v-else :value="moderate - value" :max="moderate + moderate" color="error" size="sm" />
  </div>
</template>

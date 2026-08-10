<script lang="ts" setup>
defineProps<{
  value: number
}>()
</script>

<template>
  <div class="w-12">
    <UProgress v-if="value >= 90" :value="value - 90" :max="10" color="success" size="sm" />
    <UProgress v-else-if="value > 50" :value="value - 50" :max="40" color="warning" size="sm" />
    <UProgress v-else :value="49 - value" :max="50" color="error" size="sm" />
  </div>
</template>

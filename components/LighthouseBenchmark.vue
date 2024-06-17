<script lang="ts" setup>
defineProps<{
  value: number
}>()
</script>

<template>
  <div class="w-12">
    <UProgress v-if="value >= 90" :value="value - 90" :max="10" color="green" size="sm" />
    <UProgress v-else-if="value > 70" :value="90 - value" :max="20" color="yellow" size="sm" />
    <UProgress v-else :value="70 - value" :max="70" color="red" size="sm" />
  </div>
</template>

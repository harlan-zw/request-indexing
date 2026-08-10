<script setup lang="ts">
defineProps<{
  benefits: string[]
}>()
</script>

<template>
  <ul class="text-sm text-muted space-y-1.5">
    <li v-for="benefit in benefits" :key="benefit" class="flex items-center gap-2">
      <UIcon name="i-lucide-check" class="size-4 shrink-0" :class="semanticColors.success.text" />
      {{ benefit }}
    </li>
  </ul>
</template>

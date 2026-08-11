<script lang="ts" setup>
defineProps<{
  site: { domain: string }
}>()
</script>

<template>
  <img :src="`/_favicon?domain=${site.domain}`" :alt="`${site.domain} logo`" class="w-4 h-4">
</template>

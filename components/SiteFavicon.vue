<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

defineProps<{
  site: SiteSelect
}>()
</script>

<template>
  <img :src="`/_favicon?domain=${site.domain}`" :alt="`${site.domain} logo`" class="w-4 h-4">
</template>

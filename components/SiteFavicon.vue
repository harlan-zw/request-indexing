<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

defineProps<{
  site: SiteSelect
}>()
</script>

<template>
  <img :src="`https://www.google.com/s2/favicons?domain=${site.domain}`" alt="favicon" class="w-4 h-4">
</template>

<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Web Indexing',
  icon: 'i-heroicons-check-circle',
})
</script>

<template>
  <div class="">
    <div class="flex gap-2 items-center">
      <h2 class="text-2xl mb-2">
        Usage
      </h2>
      <div class="text-xs text-gray-500">
        Usage for the <span class="underline font-semibold">last 30 days</span>.
      </div>
    </div>
    <UCard>
      <TablePsiScans :site="site" />
    </UCard>
  </div>
</template>

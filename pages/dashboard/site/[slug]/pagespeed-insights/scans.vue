<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

defineProps<{ site: SiteSelect }>()

definePageMeta({
  layout: 'dashboard',
  title: 'PageSpeed Insights',
  icon: 'i-heroicons-rocket',
})
</script>

<template>
  <div class="">
    <div class="flex gap-2 items-center">
      <h2 class="text-2xl mb-2">
        Scans
      </h2>
      <div class="text-xs text-gray-500">
        All scans for the <span class="underline font-semibold">last 30 days</span>.
      </div>
    </div>
    <UCard>
      <TablePsiScans :site="site" />
    </UCard>
  </div>
</template>

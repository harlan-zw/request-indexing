<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Keywords',
  icon: 'i-heroicons-magnifying-glass-circle',
})
</script>

<template>
  <div>
    <div class="grid grid-cols-3 w-full gap-10 mb-10">
      <UCard>
        Total Search Volume
        <div class="text-3xl font-bold">
          1,000,000
        </div>
      </UCard>
    </div>
    <h2>Your ranking keywords</h2>
    <UCard>
      <TableKeywordSearchVolume :site="site" />
    </UCard>
  </div>
</template>

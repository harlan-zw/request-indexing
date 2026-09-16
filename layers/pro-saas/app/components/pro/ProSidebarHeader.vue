<script setup lang="ts">
// Ported from nuxtseo.com's `ProSidebarHeader.vue`: the brand mark alone, then
// the search trigger. The wordmark would crowd the trigger out of a w-64 rail.
import { NuxtLink, OgBrand } from '#components'
import ProCommandPaletteTrigger from './ProCommandPaletteTrigger.vue'

defineProps<{ to: string }>()
const emit = defineEmits<{ navigate: [] }>()
</script>

<template>
  <div class="flex min-w-0 items-center gap-2">
    <NuxtLink
      :to="to"
      aria-label="Request Indexing dashboard"
      class="flex size-11 shrink-0 items-center justify-center rounded-md text-default outline-none transition-colors hover:bg-elevated focus-visible:ring-2 focus-visible:ring-primary lg:size-7"
      @click="emit('navigate')"
    >
      <OgBrand :size="24" semantic />
    </NuxtLink>
    <ProCommandPaletteTrigger class="h-11 min-w-0 flex-1 lg:h-7" @click="emit('navigate')" />
  </div>
</template>

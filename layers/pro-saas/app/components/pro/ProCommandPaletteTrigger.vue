<script setup lang="ts">
// Ported from nuxtseo.com's `ProCommandPaletteTrigger.vue`. The label drops
// "or ask": this app has no AI assistant to hand a query to.
import { computed } from 'vue'
import { UiIcon } from '#components'
import { useProCommandPalette } from '../../composables/useProCommandPalette'

const { openPalette } = useProCommandPalette()

const isMac = computed(() => import.meta.client && /Mac|iPod|iPhone|iPad/.test(navigator.platform))
const modKeyLabel = computed(() => isMac.value ? '⌘' : 'Ctrl')
</script>

<template>
  <button
    type="button"
    class="flex w-full items-center gap-2 rounded-md border border-default bg-muted px-2 py-1 text-left text-default transition-colors hover:bg-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
    @click="openPalette"
  >
    <UiIcon name="search" class="size-3.5 shrink-0" aria-hidden="true" />
    <span class="flex-1 truncate text-xs font-medium">Search…</span>
    <kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-default bg-default text-mini font-mono text-muted shrink-0">
      <span class="leading-none">{{ modKeyLabel }}</span>
      <span class="leading-none">K</span>
    </kbd>
  </button>
</template>

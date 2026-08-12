<script lang="ts" setup>
// `domain` is null on sites imported from the old KV store, which produced a
// literal `?domain=null` favicon request. `siteLabel` falls back to the Search
// Console property and strips the `sc-domain:` / scheme prefixes, leaving a
// bare hostname the favicon proxy can resolve.
const { site } = defineProps<{
  site: { domain?: string | null, property?: string | null }
}>()

const host = computed(() => siteLabel(site))
</script>

<template>
  <img :src="`/_favicon?domain=${host}`" :alt="`${host} logo`" class="w-4 h-4">
</template>

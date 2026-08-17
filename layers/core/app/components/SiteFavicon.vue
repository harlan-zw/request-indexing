<script lang="ts" setup>
// `domain` is null on sites imported from the old KV store, which produced a
// literal `?domain=null` favicon request. `siteLabel` falls back to the Search
// Console property and strips the `sc-domain:` / scheme prefixes, leaving a
// bare hostname the favicon proxy can resolve.
const { site } = defineProps<{
  site: { domain?: string | null, property?: string | null }
}>()

const host = computed(() => siteLabel(site))

// A failed `/_favicon` request left the browser's broken-image glyph next to an
// empty title, so the card looked broken rather than iconless.
const failed = ref(false)
watch(host, () => {
  failed.value = false
})
</script>

<template>
  <UIcon
    v-if="failed || !host"
    name="i-lucide-globe"
    class="size-4 shrink-0 text-dimmed"
    :aria-label="host ? `${host} logo unavailable` : 'Site logo unavailable'"
  />
  <img
    v-else
    :src="`/_favicon?domain=${host}`"
    :alt="`${host} logo`"
    class="size-4 shrink-0"
    @error="failed = true"
  >
</template>

<script setup lang="ts">
// `sites.domain` is a nullable column, so a null hostname reaches this
// component. `cleanDomain` collapses it to `''`, and the template falls back
// to a globe icon instead of throwing "Cannot read properties of null".
const { domain, size = 20, alt = '' } = defineProps<{
  domain: string | null | undefined
  size?: number
  alt?: string
}>()

const host = computed(() => cleanDomain(domain))
const src = computed(() => `https://www.google.com/s2/favicons?domain=${host.value}&sz=128`)
</script>

<template>
  <UIcon
    v-if="!host"
    name="i-lucide-globe"
    class="shrink-0 text-dimmed"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :aria-label="alt || 'Site logo unavailable'"
  />
  <img
    v-else
    :src="src"
    :alt="alt"
    :width="size"
    :height="size"
    class="rounded shrink-0"
  >
</template>

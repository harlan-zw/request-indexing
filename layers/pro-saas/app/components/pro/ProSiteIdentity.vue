<script setup lang="ts">
const props = withDefaults(defineProps<{
  url: string
  name?: string | null
  /** Favicon size in px */
  size?: number
  /** Extra classes on the favicon */
  faviconClass?: string
}>(), {
  size: 32,
})

function getHostname(url: string) {
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    return new URL(fullUrl).hostname
  }
  catch {
    return url
  }
}

const hostname = computed(() => getHostname(props.url))
const displayName = computed(() => props.name || hostname.value)
const showSubtitle = computed(() => props.name && props.name !== hostname.value)
</script>

<template>
  <div class="flex items-center gap-3 min-w-0">
    <ProFavicon :domain="hostname" :size="size" :alt="displayName" :class="faviconClass" />
    <div class="flex flex-col min-w-0">
      <span class="text-sm font-medium text-default truncate">
        {{ displayName }}
      </span>
      <span v-if="showSubtitle" class="text-xs text-dimmed truncate">
        {{ hostname }}
      </span>
    </div>
  </div>
</template>

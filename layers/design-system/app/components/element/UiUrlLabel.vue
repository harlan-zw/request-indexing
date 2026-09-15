<script setup lang="ts">
import { computed } from 'vue'
import { NuxtLink, UiFavicon, UiIcon } from '#components'
import { prettifyUrl, urlHostname } from '../../../shared/utils/urls'

const {
  url,
  favicon = true,
  faviconSize = 16,
  external = false,
  showPath = true,
  label,
  to,
} = defineProps<{
  /** A full URL, bare hostname, or `sc-domain:` value. */
  url: string
  /** Render the favicon for the host. */
  favicon?: boolean
  faviconSize?: number
  /** Render as an external link that opens the URL in a new tab. */
  external?: boolean
  /** Keep the path in the label; when false only the hostname is shown. */
  showPath?: boolean
  /** Override the auto-derived label text (e.g. an already-compacted path)
   *  while the favicon/href still resolve from `url`. */
  label?: string
  /** Internal deep link — renders the label as a `NuxtLink` (`:to`, never
   *  `@click`). Ignored when `external` is set (that already opens `url` in
   *  a new tab via a real anchor). */
  to?: string
}>()

const host = computed(() => urlHostname(url))
const displayLabel = computed(() => label ?? (showPath ? prettifyUrl(url) : host.value))
const href = computed(() => {
  if (!external)
    return undefined
  return /^[a-z][\w+.-]*:\/\//i.test(url) ? url : `https://${host.value}`
})
const isLink = computed(() => external || !!to)
</script>

<template>
  <component
    :is="external ? 'a' : (to ? NuxtLink : 'span')"
    :href="href"
    :to="!external && to ? to : undefined"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener' : undefined"
    class="inline-flex min-w-0 max-w-full items-center gap-1.5"
    :class="isLink ? 'group/url transition-colors hover:text-primary' : ''"
  >
    <UiFavicon
      v-if="favicon && host"
      :domain="host"
      :size="faviconSize"
      :alt="`${host} favicon`"
    />
    <span translate="no" class="truncate text-sm">{{ displayLabel }}</span>
    <span v-if="external" class="sr-only">(opens in new tab)</span>
    <UiIcon
      v-if="external"
      name="external"
      class="size-3 shrink-0 text-dimmed opacity-0 transition-opacity group-hover/url:opacity-100"
      aria-hidden="true"
    />
  </component>
</template>

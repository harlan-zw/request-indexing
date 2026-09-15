<script setup lang="ts">
import { computed } from 'vue'
import { UiFavicon, UiTooltip } from '#components'

export interface FaviconStackSite {
  /** Hostname, full URL, or `sc-domain:` property — `UiFavicon` normalises it. */
  domain: string
  /** The visible Site name. Names the Site in the tooltip and the fallback initial. */
  label: string
}

/**
 * A row's Site identity, as favicons only.
 *
 * List rows repeat their Site on every line. Spelled out, the name is a second
 * text column that competes with the diagnosis and truncates first on narrow
 * screens. A framed favicon carries the same identity in 20px and reads as an
 * icon, not as content. The name is one hover away, and the caller still owns
 * the accessible name of any control the stack sits inside.
 *
 * Mirrors `UiSourceLogos`: the same frame, the same `-ml-1.5` overlap, the same
 * `role="img"` wrapper. Sources say WHERE a finding came from; this says WHICH
 * Site it belongs to. One Site renders as a single frame, which is the same
 * markup with nothing to overlap.
 */

const { sites, size = 'sm', max = 4 } = defineProps<{
  sites: readonly FaviconStackSite[]
  /** Favicon pixel size: `xs` is 14px, `sm` is 16px. */
  size?: 'xs' | 'sm'
  /** Favicons rendered before the rest collapse into a `+N` frame. */
  max?: number
}>()

const shown = computed(() => sites.slice(0, Math.max(1, max)))
const overflow = computed(() => sites.length - shown.value.length)

// Every Site is named, including the ones behind `+N` — the tooltip is the only
// place the reader can recover a name the row no longer prints.
const accessibleLabel = computed(() => sites.map(site => site.label).join(', '))

const iconPixels = computed(() => (size === 'xs' ? 14 : 16))
const frameClass = computed(() => (size === 'xs' ? 'size-5' : 'size-6'))
</script>

<template>
  <!--
    `trigger-as="child"` so the trigger IS the stack. The default `span` wrapper
    would add an inline-block layer inside the row's flex line, and the `button`
    variant would nest a control inside rows that are themselves one button or
    one link.
  -->
  <UiTooltip v-if="sites.length" :text="accessibleLabel" trigger-as="child">
    <span
      class="inline-flex shrink-0 items-center"
      role="img"
      :aria-label="accessibleLabel"
    >
      <span
        v-for="(site, index) in shown"
        :key="site.domain"
        class="inline-flex shrink-0 items-center justify-center rounded-md border border-default bg-default shadow-xs"
        :class="[frameClass, index ? '-ml-1.5' : '']"
        aria-hidden="true"
      >
        <!-- `fallbackLabel` so a domain with no reachable favicon still shows an
             initial rather than an empty frame — the frame IS the identity here. -->
        <UiFavicon
          :domain="site.domain"
          :size="iconPixels"
          :fallback-label="site.label"
          fallback-surface="transparent"
          decorative
        />
      </span>
      <span
        v-if="overflow > 0"
        class="-ml-1.5 inline-flex shrink-0 items-center justify-center rounded-md border border-default bg-default text-mini font-medium tabular-nums leading-none text-muted shadow-xs"
        :class="frameClass"
        aria-hidden="true"
      >+{{ overflow }}</span>
    </span>
  </UiTooltip>
</template>

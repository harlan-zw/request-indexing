<script setup lang="ts">
import { computed, ref, useAttrs, watch } from 'vue'
import { UiIcon } from '#components'
import { useFaviconBacking } from '../../composables/useFaviconBacking'
import { faviconFallbackInitial, faviconProxyPath, isBlankFaviconSize } from '../../utils/favicon-fallback'

// Three conditional root branches below (loading / fallback / favicon) mean
// Vue's automatic single-root attrs fallthrough is unreliable across SSR vs
// client hydration — callers commonly pass `class="shrink-0 rounded ..."`
// straight onto `<UiFavicon>`, and the SSR render silently dropped it while
// the client vdom kept it, producing a "Hydration class mismatch" warning on
// every favicon call site that passes a class (UiSkeleton uses the same fix
// for the same reason). Forward `class` explicitly and identically on every
// branch instead of relying on implicit fallthrough.
defineOptions({ inheritAttrs: false })

/**
 * Site favicon with a deterministic initials fallback. Google s2 favicons fail,
 * 404 to a generic globe, or are indistinguishable across related domains, so on
 * load error (or a missing domain) we render a neutral box with the registrable
 * name's first letter. Always pair with the site/group label in the caller — the
 * favicon is identity reinforcement, never the sole identifier.
 *
 * Accepts a bare hostname, a full URL, or an `sc-domain:` GSC property; all are
 * normalised to a hostname, so callers don't need to pre-strip.
 *
 * Served through `/api/favicon` (same-origin proxy) so the image can be sampled
 * on a canvas for an adaptive contrast tile — see useFaviconBacking. Favicons
 * whose ink would vanish against the current theme (e.g. a black glyph on the
 * dark sidebar) get a `bg-inverted` tile in that theme only; everything else
 * renders bare and keeps its brand colour.
 */
const { domain, size = 20, alt = '', loading = false, decorative = false, fallbackLabel = '', fallbackSurface = 'neutral', dither = false } = defineProps<{
  domain: string
  size?: number
  alt?: string
  /** Render a spinner in place of the favicon (e.g. while the site is being
   *  validated/added). Keeps the same footprint so the row doesn't shift. */
  loading?: boolean
  /** The site name is already shown as adjacent text — mark the favicon
   *  `aria-hidden` so screen readers don't announce the host twice. */
  decorative?: boolean
  /** Prefer this visible Site label when deriving the fallback initial. */
  fallbackLabel?: string
  /** Let a first-party identity wrapper supply the fallback surface. */
  fallbackSurface?: 'neutral' | 'transparent'
  /**
   * Quiet monochrome mark for rows that shouldn't compete with a heavier
   * sibling column (Overview's Next Actions / Recent Activity beside Sites).
   * CSS-only: desaturates and softens the image and stipples it with a fine
   * dot mask. The fallback initial keeps the same opacity but no mask — a
   * single letter has nothing to lose by disappearing into dots.
   */
  dither?: boolean
}>()

const cleanDomain = computed(() =>
  (domain ?? '')
    .replace(/^sc-domain:/, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .trim(),
)
const src = computed(() => faviconProxyPath(cleanDomain.value))

// Decorative favicons (the caller already shows the site name as text) go
// `aria-hidden` so the host isn't announced twice; otherwise expose it as an image.
const a11y = computed(() =>
  decorative
    ? { 'aria-hidden': 'true' as const }
    : { 'role': 'img', 'aria-label': alt || cleanDomain.value || 'Unknown site' },
)

const failed = ref(false)
// Reset the error state if the domain changes (list rows reuse the node).
watch(cleanDomain, () => {
  failed.value = false
})

const initial = computed(() => faviconFallbackInitial(fallbackLabel, cleanDomain.value))
const showFallback = computed(() => failed.value || !cleanDomain.value)

// We never touch the favicon — it always renders at full size and pops. The
// contrast fix is purely a background placed *behind* it, which shows through the
// favicon's transparent areas. `bg-inverted` is theme-aware (light on dark themes,
// dark on light themes) and we only ever render the chip in the theme where the
// favicon would vanish, so a single softened token covers both cases: the 80%
// opacity keeps it a muted chip rather than a stark card while staying light/dark
// enough for the glyph to read.
const { backing, onLoad } = useFaviconBacking(() => cleanDomain.value)
function handleLoad(event: Event) {
  const image = event.currentTarget
  if (image instanceof HTMLImageElement && isBlankFaviconSize(image.naturalWidth, image.naturalHeight)) {
    failed.value = true
    return
  }
  onLoad(event)
}
const attrs = useAttrs()
</script>

<template>
  <span
    v-if="loading"
    v-bind="attrs"
    class="inline-flex items-center justify-center shrink-0 text-muted"
    :style="{ width: `${size}px`, height: `${size}px` }"
    role="img"
    :aria-label="alt || cleanDomain || 'Loading'"
  >
    <UiIcon name="loading" class="animate-spin motion-reduce:animate-none" :style="{ width: `${size}px`, height: `${size}px` }" />
  </span>
  <span
    v-else-if="showFallback"
    v-bind="{ ...attrs, ...a11y }"
    class="inline-flex items-center justify-center rounded border font-semibold shrink-0 leading-none select-none"
    :class="[
      fallbackSurface === 'transparent'
        ? 'border-transparent bg-transparent'
        : 'border-default bg-elevated text-muted',
      dither ? 'ui-favicon-dither-fallback' : '',
    ]"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.5)}px` }"
  >{{ initial }}</span>
  <!--
    Always the SAME element shape (span > img) regardless of `backing` — only
    its classes react. `backing` flips from a client-only canvas sample
    (`useFaviconBacking`) that can resolve via `onMounted`/`onLoad` before a
    later same-domain favicon elsewhere on the page finishes its OWN hydration
    compare (Suspense-chunked hydration interleaves mount callbacks between
    chunks). A `v-if`/`v-else` swap between a bare `<img>` and a wrapping
    `<span>` turned that race into a STRUCTURAL SSR/client mismatch — extra
    wrapper element, not just a class — which cascades into 6-7 "Hydration
    node/children mismatch" warnings per row (every repeated favicon site
    board / portfolio queue row renders). A class-only toggle can never
    mismatch this way: attribute differences patch silently, node-count
    differences don't happen because the node never comes or goes.
  -->
  <span
    v-else
    v-bind="attrs"
    class="inline-grid place-items-center rounded shrink-0"
    :class="[backing !== 'none' ? 'bg-inverted/80 ring-1 ring-default' : '', dither ? 'ui-favicon-dithered' : '']"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <img
      :src="src"
      :alt="decorative ? '' : alt"
      :aria-hidden="decorative ? 'true' : undefined"
      :width="size"
      :height="size"
      loading="lazy"
      decoding="async"
      class="rounded"
      :class="dither ? 'ui-favicon-dither' : ''"
      @load="handleLoad"
      @error="failed = true"
    >
  </span>
</template>

<style scoped>
/*
 * `dither` — a quiet mark for rows beside a heavier sibling column. Two
 * layers, both transitionable: the image loses most of its saturation and
 * some contrast, and a 2px stipple of the page background sits over it so a
 * saturated brand mark reads as texture rather than a pop of colour. Colour
 * is muted, never removed: at a glance the mark stays recognisable. Hovering
 * the row (any `a`, `button`, or `.group` ancestor) fades both layers away,
 * so the favicon comes back to full colour under the pointer.
 */
.ui-favicon-dithered {
  position: relative;
  isolation: isolate;
}

.ui-favicon-dithered::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background-image: radial-gradient(circle, var(--ui-bg) 38%, transparent 44%);
  background-size: 2px 2px;
  opacity: .55;
  pointer-events: none;
  transition: opacity 180ms var(--ease-standard, ease);
}

.ui-favicon-dither {
  filter: saturate(.35) contrast(.9) opacity(.85);
  transition: filter 180ms var(--ease-standard, ease);
}

:is(a, button, .group):hover .ui-favicon-dithered::after {
  opacity: 0;
}

:is(a, button, .group):hover .ui-favicon-dither {
  filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .ui-favicon-dithered::after,
  .ui-favicon-dither {
    transition: none;
  }
}

/* The fallback initial is text, not an image — dropping its opacity to match
   is enough to read as "quiet"; stippling a single letter makes it illegible
   instead, which the dither treatment must never do. */
.ui-favicon-dither-fallback {
  opacity: .7;
  transition: opacity 180ms var(--ease-standard, ease);
}

:is(a, button, .group):hover .ui-favicon-dither-fallback {
  opacity: 1;
}
</style>

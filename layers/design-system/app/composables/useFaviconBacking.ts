import { computed, onMounted, ref, watch } from 'vue'
import { useColorMode } from '#imports'

/**
 * Adaptive favicon backing. Many real favicons (zhead's dark triangle, GitHub's
 * octocat, Vercel's near-black square) carry no usable contrast against one of the
 * two dashboard themes and visually vanish. Rather than blanket every favicon with
 * a light tile (which would needlessly flatten brand-colour favicons), we sample
 * each favicon's dominant luminance once and only add a tile in the theme where it
 * would otherwise disappear.
 *
 * Sampling requires a canvas read, so the favicon MUST be same-origin — UiFavicon
 * serves it through `/api/favicon` for exactly this reason. A cross-origin image
 * taints the canvas and `getImageData` throws; we treat that as `unknown` (no
 * backing) so the component still renders, just without the adaptive remedy.
 */
export type FaviconTone = 'dark' | 'light' | 'neutral' | 'unknown'
export type FaviconBacking = 'light' | 'dark' | 'none'

// Dominant luminance below DARK reads as "dark ink/fill" (needs a light tile on
// dark themes); above LIGHT reads as "light ink" (needs a dark tile on light
// themes). The wide neutral band keeps colourful favicons (Stripe, Cloudflare,
// npm) untouched on both themes.
const DARK = 0.22
const LIGHT = 0.8

// Per-domain memo: classification is stable for a domain, so sample at most once
// per domain per session and persist across sessions to avoid a backing flash.
const memo = new Map<string, FaviconTone>()
const LS_KEY = 'ui-favicon-tone-v1'
let hydrated = false

function hydrate() {
  if (hydrated || !import.meta.client)
    return
  hydrated = true
  try {
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Record<string, FaviconTone>
    for (const [k, v] of Object.entries(stored)) memo.set(k, v)
  }
  catch {
    // Corrupt cache is not worth surfacing; fall back to re-sampling.
  }
}

function persist() {
  if (!import.meta.client)
    return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(Object.fromEntries(memo)))
  }
  catch {
    // Storage full / disabled — sampling still works, just not cached cross-session.
  }
}

function classifyTone(img: HTMLImageElement): FaviconTone {
  const n = 32
  const canvas = document.createElement('canvas')
  canvas.width = n
  canvas.height = n
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx)
    return 'unknown'
  ctx.drawImage(img, 0, 0, n, n)

  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, n, n).data
  }
  catch {
    return 'unknown' // tainted canvas (cross-origin favicon)
  }

  // Mean relative luminance over the visible ink, weighted by alpha so soft
  // edges don't drag a solid glyph toward neutral.
  let lumSum = 0
  let alphaSum = 0
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3] ?? 0
    if (a < 16)
      continue
    const r = data[i] ?? 0
    const g = data[i + 1] ?? 0
    const b = data[i + 2] ?? 0
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    lumSum += l * a
    alphaSum += a
  }
  if (alphaSum === 0)
    return 'unknown' // fully transparent / empty
  const meanLum = lumSum / alphaSum
  if (meanLum < DARK)
    return 'dark'
  if (meanLum > LIGHT)
    return 'light'
  return 'neutral'
}

export function useFaviconBacking(domain: () => string) {
  // Start 'unknown' on both server and first client render so SSR HTML and
  // hydration agree; only read the cross-session cache after mount. Otherwise a
  // cached tone would diverge from the server's 'unknown' → favicon-tile
  // hydration mismatch.
  const tone = ref<FaviconTone>('unknown')
  onMounted(() => {
    hydrate()
    tone.value = memo.get(domain()) ?? 'unknown'
  })
  watch(domain, d => (tone.value = memo.get(d) ?? 'unknown'))

  function onLoad(e: Event) {
    const key = domain()
    const cached = memo.get(key)
    if (cached) {
      tone.value = cached
      return
    }
    const t = classifyTone(e.target as HTMLImageElement)
    memo.set(key, t)
    persist()
    tone.value = t
  }

  const colorMode = useColorMode()
  const backing = computed<FaviconBacking>(() => {
    const isDark = colorMode.value === 'dark'
    // We only ever add the tile in the theme where the favicon would vanish; in
    // the other theme its native contrast is fine, so we leave it bare and keep
    // any brand colour. The tile uses `bg-inverted`, which resolves to the right
    // shade automatically: white on dark themes, dark on light themes — i.e.
    // exactly the surface a vanishing favicon needs in the theme we apply it.
    if (tone.value === 'dark')
      return isDark ? 'light' : 'none'
    if (tone.value === 'light')
      return isDark ? 'none' : 'dark'
    return 'none'
  })

  return { backing, onLoad }
}

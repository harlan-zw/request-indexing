<script setup lang="ts">
import { computed } from 'vue'
// The greydient application primitive. Turns intent into a correctly-rendered
// atmospheric layer — palette × geometry × intensity, plus grain — with the
// mask/opacity/mode-handling all centralized in global.css (`.ui-atmosphere`).
// Consumers place it as the first child of a `relative` container (content then
// sits above it); for `sky` it spans the top of the nearest positioned ancestor.
//
// This is the ONE place greydient atmosphere is produced. Never on data surfaces
// (charts/tables/metrics); contained identity chrome follows DESIGN's explicit
// micro-surface exception — "atmosphere at the edges, silence at the center".
type Palette = 'ink' | 'twilight' | 'dawn' | 'dusk' | 'dusk-vivid' | 'mist' | 'ash'
type Geometry = 'sky' | 'bloom' | 'wash' | 'veil'
type Intensity = 'subtle' | 'ambient' | 'present' | 'vivid'
type Preset = 'front-door' | 'error' | 'ai' | 'preview' | 'share'

const {
  palette: paletteProp,
  geometry: geometryProp,
  intensity: intensityProp,
  grain = true,
  preset,
} = defineProps<{
  /** Which greydient — the day-cycle of visibility states. */
  palette?: Palette
  /** How it's shaped. sky = full-bleed top; bloom = soft glow; wash = framed directional; veil = preview scrim. */
  geometry?: Geometry
  /** How present, per mode. subtle behind text; vivid is reserved for tiny identity surfaces. */
  intensity?: Intensity
  /** Fine grain for tooth. Default on. */
  grain?: boolean
  /** Semantic shortcut — resolves palette+geometry+intensity from one intent. Explicit props win. */
  preset?: Preset
}>()

// The semantic map — the design decision ("front door = dusk bloom") lives HERE,
// once, instead of scattered across surfaces. Explicit props still override.
// Canonical palette roles (DESIGN / brand-kit): ink = OG/share ground · twilight
// = auth · dawn = marketing warmth · dusk = hero (spends color) · mist = behind
// text · ash = neutral. Presets encode those roles once.
const PRESETS: Record<Preset, { palette: Palette, geometry: Geometry, intensity: Intensity }> = {
  'front-door': { palette: 'twilight', geometry: 'bloom', intensity: 'present' },
  'error': { palette: 'twilight', geometry: 'sky', intensity: 'subtle' },
  'ai': { palette: 'dusk', geometry: 'bloom', intensity: 'ambient' },
  'preview': { palette: 'mist', geometry: 'veil', intensity: 'subtle' },
  'share': { palette: 'ink', geometry: 'wash', intensity: 'present' },
}

const base = computed(() => (preset ? PRESETS[preset] : { palette: 'ash' as Palette, geometry: 'wash' as Geometry, intensity: 'ambient' as Intensity }))
const palette = computed(() => paletteProp ?? base.value.palette)
const geometry = computed(() => geometryProp ?? base.value.geometry)
const intensity = computed(() => intensityProp ?? base.value.intensity)
</script>

<template>
  <div
    aria-hidden="true"
    class="ui-atmosphere"
    :data-geometry="geometry"
    :data-intensity="intensity"
    :data-grain="grain ? '' : undefined"
    :style="{ '--_atmo-greydient': `var(--greydient-${palette})` }"
  />
</template>

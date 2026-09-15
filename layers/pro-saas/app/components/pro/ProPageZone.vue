<script lang="ts" setup>
import { computed } from 'vue'
/**
 * Enforces the design system's three-tier visual hierarchy and spacing rules.
 *
 * - `primary`: Hero zone (metrics, main chart). No top margin on first zone, `mt-8`–`mt-10` gap before secondary.
 * - `secondary`: Supporting grids, data lists. Uses `gap-6` internally.
 * - `tertiary`: Detail tables, breakdowns. Preceded by separator-level spacing.
 *
 * The 2x rule is automatic: zone gaps (`mt-8`–`mt-10`) are always ≥2x within-zone gaps (`gap-4`–`gap-6`).
 */
const { tier = 'primary', first = false } = defineProps<{
  /** Visual hierarchy tier */
  tier?: 'primary' | 'secondary' | 'tertiary'
  /** Set true for the first zone on the page (suppresses top margin) */
  first?: boolean
}>()

// Spacing routes through the --density-section-gap / --density-element-gap
// knobs (global.css) so page rhythm tunes centrally; the primary tier runs
// 0.5rem tighter on both axes (hero zones couple their content more closely).
const classes = computed(() => {
  const base: string[] = ['flex', 'flex-col']

  // Top margin between zones (suppressed for first zone)
  if (!first) {
    if (tier === 'primary')
      base.push('mt-[calc(var(--density-section-gap)-0.5rem)]')
    else
      base.push('mt-(--density-section-gap)')
  }

  // Internal gap per tier
  if (tier === 'primary')
    base.push('gap-[calc(var(--density-element-gap)-0.5rem)]')
  else
    base.push('gap-(--density-element-gap)')

  return base
})
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>

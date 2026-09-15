<script setup lang="ts">
/**
 * UiImpactMeter — monochrome 3-bar magnitude glyph (ascending signal bars).
 * The magnitude counterpart of the severity dot/bar: severity says "how
 * broken", the meter says "how big" (an opportunity's upside, a action's
 * effort). Shape carries the scale, never color (Icons color rule) — filled
 * bars read as dimmed text, empty bars as border. The owning layer maps its
 * domain figure to the 1–3 tier (design-system knows shapes, not traffic or
 * effort thresholds); the `label` names which magnitude this instance encodes.
 */

const { tier, label } = defineProps<{
  /** 1 (low) – 3 (high). */
  tier: 1 | 2 | 3
  /** Accessible + tooltip label, e.g. "Projected impact: high". */
  label?: string
}>()

const BAR_HEIGHT = ['h-1', 'h-1.5', 'h-2'] as const
</script>

<template>
  <span class="inline-flex items-end gap-px" :title="label">
    <span v-if="label" class="sr-only">{{ label }}</span>
    <span
      v-for="i in 3"
      :key="i"
      class="w-[3px] rounded-[1px]"
      :class="[BAR_HEIGHT[i - 1], i <= tier ? 'bg-[var(--ui-text-dimmed)]' : 'bg-[var(--ui-border)]']"
      aria-hidden="true"
    />
  </span>
</template>

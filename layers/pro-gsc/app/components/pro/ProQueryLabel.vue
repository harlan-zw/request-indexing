<script setup lang="ts">
import { NuxtLink } from '#components'

interface QueryVariant {
  query: string
  clicks: number
  impressions: number
  position: number
}

const {
  keyword,
  variantCount,
  variants,
  position,
  brand = false,
  to,
  size = 'sm',
} = defineProps<{
  /** Display name (top variant) */
  keyword: string
  /** Canonical form for linking */
  queryCanonical?: string | null
  /** Number of grouped variants */
  variantCount?: number | null
  /** Variant breakdown data for tooltip */
  variants?: QueryVariant[] | null
  /** Average position (shown as badge when <= 10) */
  position?: number | null
  /** Whether this is a brand keyword */
  brand?: boolean
  /** Optional NuxtLink destination */
  to?: string
  /** Text size: 'xs' | 'sm' */
  size?: 'xs' | 'sm'
}>()

const showVariants = computed(() => (variantCount ?? 0) > 1)
const hasVariantData = computed(() => variants?.length && variants[0]?.position)

const positionStyle = computed(() => {
  if (position == null || position > 10)
    return ''
  if (position <= 3)
    return 'position-badge position-badge--top'
  return 'position-badge position-badge--page1'
})
</script>

<template>
  <span class="flex items-center gap-1.5 min-w-0 w-full">
    <component
      :is="to ? NuxtLink : 'span'"
      :to="to"
      :title="keyword"
      class="truncate text-default"
      :class="[
        size === 'xs' ? 'text-xs' : 'text-sm font-medium',
        to && 'hover:text-primary transition-colors',
      ]"
    >
      {{ keyword }}
    </component>
    <!-- Variant count with optional breakdown tooltip -->
    <UiTooltip v-if="showVariants && hasVariantData" size="xl">
      <span class="variant-badge variant-badge--interactive">
        {{ variantCount }}v
      </span>
      <template #text>
        <div class="space-y-2">
          <div class="text-[10px] uppercase tracking-wider text-muted font-medium">
            {{ variantCount }} grouped variants
          </div>
          <div class="max-h-[240px] overflow-y-auto pointer-events-auto">
            <div class="w-full text-[11px] tabular-nums">
              <div class="flex text-dimmed text-[10px] uppercase tracking-wider sticky top-0 bg-elevated pb-1">
                <span class="flex-1 font-medium pr-3">Query</span>
                <span class="w-12 text-right font-medium px-2">Pos</span>
                <span class="w-14 text-right font-medium px-2">Clicks</span>
                <span class="w-14 text-right font-medium pl-2">Impr</span>
              </div>
              <div v-for="v in variants" :key="v.query" class="flex items-center border-t border-default/30 py-0.5">
                <span class="flex-1 pr-3 max-w-[180px] truncate">{{ v.query }}</span>
                <span class="w-12 px-2 text-right">
                  <span
                    class="font-medium"
                    :class="v.position <= 3 ? 'text-warning' : v.position <= 10 ? 'text-primary' : 'text-muted'"
                  >
                    {{ v.position.toFixed(1) }}
                  </span>
                </span>
                <span class="w-14 px-2 text-right">{{ formatNumber(v.clicks) }}</span>
                <span class="w-14 pl-2 text-right text-muted">{{ formatNumber(v.impressions) }}</span>
              </div>
            </div>
            <div v-if="variantCount && variants && variantCount > variants.length" class="text-[10px] text-dimmed pt-1">
              +{{ variantCount - variants.length }} more
            </div>
          </div>
        </div>
      </template>
    </UiTooltip>
    <span
      v-else-if="showVariants"
      :title="`${variantCount} query variants grouped`"
      class="variant-badge"
    >
      {{ variantCount }}v
    </span>
    <!-- Position rank — colored, higher visual weight -->
    <span
      v-if="position != null && position <= 10"
      title="Avg position"
      :class="positionStyle"
    >
      #{{ Math.round(position) }}
    </span>
    <UIcon v-if="brand" name="i-lucide-badge-check" title="Brand term" class="size-3.5 shrink-0" :class="brandVizColor.text" />
    <slot />
  </span>
</template>

<style scoped>
.variant-badge {
  font-size: 10px;
  line-height: 1;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  padding: 1px 4px;
  border-radius: 3px;
  flex-shrink: 0;
  color: var(--ui-text-dimmed);
  opacity: 0.55;
  border: 1px dashed var(--ui-border);
}

.variant-badge--interactive {
  opacity: 0.7;
  cursor: default;
  border-style: dotted;
  border-color: var(--ui-border-accented);
}

.variant-badge--interactive:hover {
  opacity: 1;
  color: var(--ui-text-muted);
}

.position-badge {
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  padding: 2px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}

.position-badge--top {
  --badge-color: var(--color-amber-500);
  color: var(--badge-color);
  background: color-mix(in srgb, var(--badge-color) 10%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--badge-color) 25%, transparent);
}

.position-badge--page1 {
  --badge-color: var(--color-blue-400);
  color: var(--badge-color);
  background: color-mix(in srgb, var(--badge-color) 8%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--badge-color) 18%, transparent);
}
</style>

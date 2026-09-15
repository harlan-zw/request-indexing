<script lang="ts" setup>
/**
 * The bar-filled metric cell with a hover popover, shared across every overview
 * "By site" table (Search Console, Indexing, Analytics, DataForSEO, CWV). The
 * trigger is a {@link UiBarCell} carrying the headline value (a `#value` slot,
 * so each tab keeps full control of formatting / threshold colors / share %) and
 * a compact sparkline; the popover panel shows a wide sparkline plus an optional
 * list of `label → value | trend` rows.
 *
 * Replaces the ~60-line block that used to be copy-pasted per metric per tab.
 */
import { useId } from 'vue'
import { UiPopover, UiSparkline, UiTrend } from '#components'
import UiBarCell from './UiBarCell.vue'

export interface MetricPanelRow {
  label: string
  /** Plain value (mono). Ignored when `trend` is set. */
  value?: string
  /** Extra classes for the value (e.g. a threshold color). */
  valueClass?: string
  /** Render a UiTrend instead of a plain value. */
  trend?: number
  trendInverted?: boolean
  /** Draw a hairline divider above this row (section break). */
  divider?: boolean
}

const {
  sparkline = [],
  panelRows = [],
} = defineProps<{
  /** Bar fill 0–100. */
  percent: number
  /** Tailwind bg class for the bar fill. */
  barClass?: string
  /** Trend/sparkline series. Rendered only when length > 1. */
  sparkline?: number[]
  /** Sparkline color (named viz color or rgb()). */
  sparklineColor?: string
  /** Popover heading + body. */
  title: string
  description: string
  /** Detail rows under the panel sparkline. */
  panelRows?: MetricPanelRow[]
}>()

const panelId = useId()
</script>

<template>
  <UiPopover mode="hover" role="tooltip" :panel-id="panelId" :content="{ side: 'bottom' }">
    <!-- Focusable trigger so the hover panel is also reachable by keyboard
         (reka HoverCard opens on focus). The headline value stays inline for
         everyone, so the panel breakdown is a true enhancement. -->
    <button
      type="button"
      class="block w-full text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      :aria-label="`${title} — show breakdown`"
      :aria-describedby="panelId"
    >
      <UiBarCell :percent="percent" :bar-class="barClass">
        <slot name="value" />
        <UiSparkline
          v-if="sparkline.length > 1"
          :data="sparkline"
          :width="56"
          :height="18"
          :color="sparklineColor"
          class="shrink-0 relative"
        />
        <slot name="trailing" />
      </UiBarCell>
    </button>
    <template #panel>
      <div class="p-3 text-xs space-y-2.5 min-w-[220px] max-w-[250px]">
        <div class="font-semibold text-default">
          {{ title }}
        </div>
        <p class="text-muted leading-relaxed">
          {{ description }}
        </p>
        <UiSparkline
          v-if="sparkline.length > 1"
          :data="sparkline"
          :color="sparklineColor"
          :width="230"
          :height="32"
        />
        <div v-if="panelRows.length" class="border-t border-default pt-2 space-y-1.5">
          <div
            v-for="row in panelRows"
            :key="row.label"
            class="flex justify-between items-center gap-4"
            :class="row.divider ? 'pt-1 border-t border-default' : ''"
          >
            <span class="text-muted">{{ row.label }}</span>
            <UiTrend
              v-if="row.trend != null"
              :value="row.trend"
              :inverted="row.trendInverted"
              colored
              format="percent"
              size="xs"
            />
            <span v-else class="font-mono font-medium tabular-nums" :class="row.valueClass ?? 'text-default'">{{ row.value }}</span>
          </div>
        </div>
        <slot name="panel-extra" />
      </div>
    </template>
  </UiPopover>
</template>

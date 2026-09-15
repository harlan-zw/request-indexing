<script lang="ts" setup generic="T extends object">
import { computed } from 'vue'
// Horizontal ranked bar chart. Sorts rows by their numeric value and draws a labelled bar per
// row, scaled to the largest value — the canonical "top N pages / queries / countries" view.
// Generic + dependency-free (CSS bars), so any row array drives it.

const {
  data,
  labelKey,
  valueKey,
  max = 8,
  sort = true,
  size = 'sm',
  density = 'regular',
  color = 'var(--ui-primary)',
  format,
  ceilingKey,
  truncatedKey,
} = defineProps<{
  data: T[]
  /** Row key for the category label. */
  labelKey: keyof T & string
  /** Row key for the numeric value. */
  valueKey: keyof T & string
  /**
   * Row key holding the observation CEILING — how far the row could have gone
   * had the producer finished (sitemap-expected pages, sampled population).
   * The span between `valueKey` and this draws hatched: observed, then
   * unobserved. Without it a short bar reads as "measured and small" when it
   * often means "we stopped looking".
   */
  ceilingKey?: keyof T & string
  /**
   * Row key holding a truthy "this value is a floor" flag — the scan hit a row
   * budget or per-rule cap, so the true count is at or above what is drawn.
   * The whole bar hatches and the value label renders `≥ n`.
   */
  truncatedKey?: keyof T & string
  /** Max rows to show (top N). Default 8. */
  max?: number
  /** Sort largest first. Disable for ordered buckets such as histograms. */
  sort?: boolean
  /** Row density. Use md when the chart is the primary comparison. */
  size?: 'sm' | 'md'
  /** Compact keeps readable type and condenses to one row when space permits. */
  density?: 'regular' | 'compact'
  /** Bar colour (any CSS colour). */
  color?: string
  /** Format the value label. */
  format?: (value: number) => string
}>()

defineSlots<{
  /** Replace the text label while preserving the ranked row and exact value. */
  label: (props: { item: T, label: string, value: number, index: number }) => unknown
}>()

function num(v: unknown) {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/^"+|"+$/g, ''))
  return Number.isFinite(n) ? n : 0
}

const rows = computed(() => {
  const values = Array.from(data, item => ({
    item,
    label: String(item[labelKey] ?? ''),
    value: num(item[valueKey]),
    // A ceiling below the observed value is meaningless, so clamp rather than
    // draw a negative provisional span.
    ceiling: ceilingKey ? Math.max(num(item[ceilingKey]), num(item[valueKey])) : 0,
    truncated: truncatedKey ? Boolean(item[truncatedKey]) : false,
  }))
  const sorted = sort ? values.sort((a, b) => b.value - a.value) : values
  const visible = sorted
    .slice(0, max)
  // The ceiling shares the value's scale — a bar whose unobserved span ran past
  // the peak would otherwise clip and read as complete.
  const peak = Math.max(1, ...visible.map(r => Math.max(r.value, r.ceiling)))
  const pct = (v: number) => Math.min(100, Math.max(0, (v / peak) * 100))
  return visible.map(r => ({
    ...r,
    pct: pct(r.value),
    // Width of the hatched span, in track percent. Zero when the row is a
    // complete observation.
    provisionalPct: r.ceiling > r.value ? pct(r.ceiling) - pct(r.value) : 0,
  }))
})

function fmt(value: number): string {
  return format ? format(value) : value.toLocaleString()
}

// `141 / 188` needs a wider value column than `141`. Widen once for the whole
// chart so the numbers stay on one right-aligned edge.
const hasCeiling = computed(() => rows.value.some(r => r.provisionalPct > 0))

/** Truncated counts are floors — say so in the label, not only in the fill. */
function fmtValue(r: { value: number, truncated: boolean }): string {
  return r.truncated ? `≥ ${fmt(r.value)}` : fmt(r.value)
}
</script>

<template>
  <ol
    data-ui="UiBarChart"
    :data-density="density"
    class="ui-bar-chart flex flex-col"
    :class="[
      size === 'md' ? 'ui-bar-chart--md' : 'ui-bar-chart--sm',
      hasCeiling ? 'ui-bar-chart--ceiling' : '',
      density === 'compact' ? 'ui-bar-chart--compact gap-1' : size === 'md' ? 'gap-3' : 'gap-1.5',
    ]"
  >
    <li
      v-for="(r, i) in rows"
      :key="`${r.label}:${i}`"
      class="ui-bar-chart__row"
    >
      <span class="ui-bar-chart__label min-w-0 text-muted" :title="r.label">
        <slot
          name="label"
          :item="r.item"
          :label="r.label"
          :value="r.value"
          :index="i"
        >{{ r.label }}</slot>
      </span>
      <div
        data-bar-track
        class="ui-bar-chart__track relative overflow-hidden rounded bg-muted/40"
        :class="density === 'compact' ? 'h-2' : size === 'md' ? 'h-7' : 'h-5'"
        aria-hidden="true"
      >
        <!-- Truncated rows hatch the whole bar: the value itself is a floor, so
             there is no solid span to separate. Width, not scaleX — a scaled
             hatch stretches its pitch and stops reading as one texture. -->
        <div
          v-if="r.truncated"
          class="provisional-hatch absolute inset-y-0 left-0 rounded ring-1 ring-inset ring-current/35"
          :style="{ width: `${r.pct}%`, color }"
        />
        <div
          v-else
          class="absolute inset-y-0 left-0 w-full origin-left rounded"
          :style="{ transform: `scaleX(${r.pct / 100})`, background: color, opacity: 0.85 }"
        />
        <!-- Observed → unobserved. Starts where the solid span ends. -->
        <div
          v-if="r.provisionalPct > 0"
          class="provisional-hatch absolute inset-y-0 rounded-r ring-1 ring-inset ring-current/30"
          :style="{ left: `${r.pct}%`, width: `${r.provisionalPct}%`, color }"
        />
      </div>
      <span class="ui-bar-chart__value text-right tabular-nums text-highlighted" :class="size === 'md' ? 'numerals-display' : ''">
        {{ fmtValue(r) }}
        <!-- The ceiling reads in the label too, not only in the fill — a hatch
             survives neither greyscale nor a cropped screenshot. -->
        <span v-if="r.provisionalPct > 0" class="text-muted">/&nbsp;{{ fmt(r.ceiling) }}</span>
        <span v-if="r.provisionalPct > 0" class="sr-only">expected, the rest unobserved</span>
        <span v-else-if="r.truncated" class="sr-only">at least — the scan hit its row budget</span>
      </span>
    </li>
  </ol>
</template>

<style scoped>
.ui-bar-chart {
  container-type: inline-size;
}

.ui-bar-chart__row {
  align-items: center;
  column-gap: 0.75rem;
  display: grid;
}

.ui-bar-chart--sm .ui-bar-chart__row {
  font-size: 0.75rem;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) 3.5rem;
}

.ui-bar-chart--sm.ui-bar-chart--ceiling .ui-bar-chart__row {
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) 5.5rem;
}

.ui-bar-chart--sm .ui-bar-chart__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ui-bar-chart--md .ui-bar-chart__row {
  font-size: 0.875rem;
  grid-template-columns: minmax(0, 1fr) auto;
  row-gap: 0.5rem;
}

.ui-bar-chart--md .ui-bar-chart__label {
  overflow-wrap: anywhere;
}

.ui-bar-chart--md .ui-bar-chart__track {
  grid-column: 1 / -1;
  grid-row: 2;
}

.ui-bar-chart__value {
  min-width: 4rem;
  white-space: nowrap;
}

.ui-bar-chart--compact .ui-bar-chart__row {
  column-gap: 0.5rem;
  font-size: 0.875rem;
  grid-template-columns: minmax(0, 1fr) max-content;
  row-gap: 0.25rem;
}

.ui-bar-chart--compact .ui-bar-chart__label {
  overflow: visible;
  overflow-wrap: anywhere;
  text-overflow: clip;
  white-space: normal;
}

.ui-bar-chart--compact .ui-bar-chart__track {
  grid-column: 1 / -1;
  grid-row: 2;
}

.ui-bar-chart--compact .ui-bar-chart__value {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
}

@container (min-width: 16rem) {
  .ui-bar-chart--compact .ui-bar-chart__row {
    grid-template-columns: minmax(0, 1.15fr) minmax(3rem, 1fr) minmax(3.5rem, max-content);
    row-gap: 0;
  }

  .ui-bar-chart--compact .ui-bar-chart__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ui-bar-chart--compact .ui-bar-chart__track {
    grid-column: 2;
    grid-row: 1;
  }

  .ui-bar-chart--compact .ui-bar-chart__value {
    grid-column: 3;
    grid-row: 1;
  }
}

@container (min-width: 36rem) {
  .ui-bar-chart--md:not(.ui-bar-chart--compact) .ui-bar-chart__row {
    grid-template-columns: minmax(10rem, 1fr) minmax(12rem, 2fr) 4rem;
    row-gap: 0;
  }

  .ui-bar-chart--md.ui-bar-chart--ceiling:not(.ui-bar-chart--compact) .ui-bar-chart__row {
    grid-template-columns: minmax(10rem, 1fr) minmax(12rem, 2fr) 6.5rem;
  }

  .ui-bar-chart--md:not(.ui-bar-chart--compact) .ui-bar-chart__track {
    grid-column: 2;
    grid-row: 1;
  }

  .ui-bar-chart--md:not(.ui-bar-chart--compact) .ui-bar-chart__value {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>

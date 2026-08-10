<script setup lang="ts">
definePageMeta({ layout: 'kit' })
useHead({ title: 'Elements · Brand Kit' })
</script>

<template>
  <div class="space-y-8">
    <KitHeader
      eyebrow="Components"
      title="Elements"
      description="Small, focused primitives from the design-system layer."
    />

    <KitSection
      title="UiIconBox"
      code="<UiIconBox>"
      description="Square icon plate. Used in headers, nav menu items, empty states."
    >
      <UCard variant="outline">
        <div class="space-y-4">
          <KitRow label="Sizes">
            <UiIconBox icon="i-lucide-search" size="sm" />
            <UiIconBox icon="i-lucide-search" size="md" />
          </KitRow>
          <KitRow label="With hover (group)">
            <div class="group flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer">
              <UiIconBox icon="i-lucide-link" hover />
              <span class="text-sm text-default">Hover the row</span>
            </div>
          </KitRow>
          <KitRow label="Gallery">
            <UiIconBox v-for="i in ['i-lucide-globe', 'i-lucide-zap', 'i-lucide-bug', 'i-lucide-shield-check', 'i-lucide-database', 'i-lucide-bar-chart-3']" :key="i" :icon="i" />
          </KitRow>
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="UiHelpLabel"
      code="<UiHelpLabel>"
      description="Label with an inline (?) help icon. Tooltip on hover."
    >
      <UCard variant="outline">
        <div class="space-y-4 max-w-md">
          <UiHelpLabel
            text="Indexed pages"
            tooltip="Pages Google has confirmed in its index in the last 28 days."
          />
          <UiHelpLabel
            text="Crawl budget"
            tooltip-title="Crawl budget"
            tooltip="The number of pages Googlebot is willing to crawl per day for this site."
          />
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="UiProgressCircle"
      code="<UiProgressCircle>"
      description="Circular progress ring sized to the surrounding row."
    >
      <UCard variant="outline">
        <div class="flex flex-wrap items-end gap-6">
          <div v-for="p in [12, 35, 58, 84, 100]" :key="p" class="flex flex-col items-center gap-2">
            <UiProgressCircle :percent="p" />
            <span class="text-[10px] text-dimmed font-mono">{{ p }}%</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <UiProgressCircle :percent="72" :size="64" :stroke-size="6" />
            <span class="text-[10px] text-dimmed font-mono">size 64</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <UiProgressCircle :percent="48" lighter />
            <span class="text-[10px] text-dimmed font-mono">lighter</span>
          </div>
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="UiTooltipGrid"
      code="<UiTooltipGrid>"
      description="A high-performance tooltip designed for dense grids (heatmaps, packed bar cells). Trigger emits coordinates; tooltip is reused via a transform translate."
    >
      <UCard variant="outline">
        <div class="space-y-3">
          <p class="text-xs text-muted">
            Hover any cell — a single tooltip element follows the cursor instead of mounting one per cell.
          </p>
          <UiTooltipGrid
            :resolve="({ row, col, value }) => ({
              title: `Cell r${row}·c${col}`,
              level: value > 60 ? 'success' : value > 30 ? 'warning' : 'neutral',
              details: [
                { label: 'Hits', value: String(value) },
                { label: 'Day', value: `2026-05-${String((col % 28) + 1).padStart(2, '0')}` },
              ],
            })"
          >
            <div class="grid grid-cols-12 gap-px">
              <div
                v-for="i in 96"
                :key="i"
                :data-tooltip-row="Math.floor((i - 1) / 12)"
                :data-tooltip-col="(i - 1) % 12"
                :data-tooltip-value="Math.round((i * 13.7) % 100)"
                class="aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110"
                :style="{ backgroundColor: `color-mix(in oklab, var(--ui-primary) ${5 + (i * 0.9) % 80}%, transparent)` }"
              />
            </div>
          </UiTooltipGrid>
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="TrendPercentage"
      code="<TrendPercentage>"
      description="Trend delta vs a previous-period value. Computes the symmetric percent change; tooltip shows the prior value."
    >
      <UCard variant="outline">
        <div class="space-y-4">
          <KitRow label="Up">
            <TrendPercentage :value="1240" :prev-value="980" />
          </KitRow>
          <KitRow label="Down">
            <TrendPercentage :value="640" :prev-value="980" />
          </KitRow>
          <KitRow label="Same">
            <TrendPercentage :value="500" :prev-value="500" />
          </KitRow>
          <KitRow label="Negative (lower=better)">
            <TrendPercentage :value="2.4" :prev-value="3.8" negative symbol="s" />
          </KitRow>
          <KitRow label="Compact">
            <TrendPercentage :value="1240" :prev-value="980" compact />
          </KitRow>
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="ProgressPercent"
      code="<ProgressPercent>"
      description="Slot + UProgress wrapped in a tooltip. Designed for inline share-of-total bars in tables."
    >
      <UCard variant="outline">
        <div class="space-y-4 max-w-md">
          <ProgressPercent :value="42" :total="100" color="primary">
            <div class="text-xs text-default mb-1 flex justify-between">
              <span>/blog</span><span class="tabular-nums">42</span>
            </div>
          </ProgressPercent>
          <ProgressPercent :value="18" :total="100" color="primary">
            <div class="text-xs text-default mb-1 flex justify-between">
              <span>/docs</span><span class="tabular-nums">18</span>
            </div>
          </ProgressPercent>
          <ProgressPercent :value="7" :total="100" color="primary">
            <div class="text-xs text-default mb-1 flex justify-between">
              <span>/pricing</span><span class="tabular-nums">7</span>
            </div>
          </ProgressPercent>
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="MetricGuage"
      code="<MetricGuage>"
      description="Lighthouse-style scored ring (0-100). Pass/average/fail color from score thresholds (90 / 50)."
    >
      <UCard variant="outline">
        <div class="flex flex-wrap items-center gap-8">
          <div v-for="s in [98, 84, 72, 49, 28]" :key="s" class="flex flex-col items-center gap-2">
            <MetricGuage :score="s / 100">
              {{ s }}
            </MetricGuage>
            <span class="text-[10px] text-dimmed font-mono">{{ s }}</span>
          </div>
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="Gradient"
      code="<Gradient>"
      description="Soft primary radial bloom on a faint grid. Use as an absolute background behind a hero panel."
    >
      <UCard variant="outline" class="overflow-hidden p-0">
        <div class="relative h-[180px] flex items-center justify-center">
          <Gradient />
          <div class="relative z-10 text-center space-y-1">
            <div class="font-title text-xl font-semibold text-highlighted">
              Gradient backdrop
            </div>
            <div class="text-xs text-muted">
              Sits behind page heroes
            </div>
          </div>
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="CardTitle"
      code="<CardTitle>"
      description="Card-level title with a quiet kebab dropdown for row-level actions."
    >
      <UCard variant="outline">
        <CardTitle>
          Top countries
        </CardTitle>
        <div class="text-xs text-muted">
          Card body content goes here.
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="DashboardPageTitle"
      code="<DashboardPageTitle>"
      description="Breadcrumb-style page chip used in dashboard headers. Auto-links back to the site root."
    >
      <UCard variant="outline">
        <div class="space-y-3">
          <DashboardPageTitle title="Overview" sub-title="" icon="i-lucide-gauge" />
          <DashboardPageTitle title="Overview" sub-title="Performance" icon="i-lucide-zap" />
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="EmptyPlaceholder"
      code="<EmptyPlaceholder>"
      description="Tiny divider used in zero-data table cells."
    >
      <UCard variant="outline">
        <KitRow label="Default">
          <EmptyPlaceholder />
        </KitRow>
      </UCard>
    </KitSection>

    <KitSection
      title="UiTrend"
      code="<UiTrend>"
      description="Compact delta indicator. inverted=true flips success/error (useful for rank position, latency)."
    >
      <UCard variant="outline">
        <div class="space-y-4">
          <KitRow label="Standard">
            <UiTrend :value="12" />
            <UiTrend :value="-7" />
            <UiTrend :value="0" />
            <UiTrend :value="142" />
          </KitRow>
          <KitRow label="Inverted (lower=better)">
            <UiTrend :value="-5" inverted />
            <UiTrend :value="12" inverted />
          </KitRow>
          <KitRow label="Sizes">
            <UiTrend :value="8" size="2xs" />
            <UiTrend :value="8" size="xs" />
            <UiTrend :value="8" size="sm" />
          </KitRow>
        </div>
      </UCard>
    </KitSection>
  </div>
</template>

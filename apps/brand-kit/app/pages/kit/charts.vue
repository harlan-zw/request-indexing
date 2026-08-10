<script setup lang="ts">
definePageMeta({ layout: 'kit' })
useHead({ title: 'Charts · Brand Kit' })

const series = Array.from({ length: 28 }, (_, i) => {
  const day = String(i + 1).padStart(2, '0')
  return {
    time: `2026-04-${day}`,
    clicks: Math.round(120 + Math.sin(i / 3) * 40 + i * 4),
    impressions: Math.round(2400 + Math.cos(i / 4) * 800 + i * 30),
  }
})

const lcpSeries = Array.from({ length: 28 }, (_, i) => ({
  time: `2026-04-${String(i + 1).padStart(2, '0')}`,
  value: Math.round(45 + Math.sin(i / 3) * 30 + (i > 18 ? 35 : 0)),
}))

const buttons = [
  { key: 'clicks', label: 'Clicks', color: 'blue', value: 4820 },
  { key: 'impressions', label: 'Impressions', color: 'purple', value: 92400 },
  { key: 'position', label: 'Position', color: 'green', value: 12.4 },
  { key: 'ctr', label: 'CTR', color: 'orange', value: 5.2 },
]
const selected = ref(['clicks', 'impressions'])
</script>

<template>
  <div class="space-y-8">
    <KitHeader
      eyebrow="Charts"
      title="Chart primitives"
      description="Generic time-series chart wrappers from layers/design-system/components/chart. Domain charts (GraphWebVital, GraphPageSpeedInsights, etc) compose these and live in core."
    />

    <KitSection
      title="GraphData"
      code="<GraphData :value :columns>"
      description="Generic multi-series area/line chart powered by lightweight-charts. Pass any rows + a columns spec; colors and labels are optional."
    >
      <UCard variant="outline">
        <div class="h-[260px]">
          <GraphData
            :value="series"
            :columns="[{ key: 'clicks', type: 'area' }, { key: 'impressions', type: 'line' }]"
            :colors="{ clicks: 'rgba(33, 150, 243, 1)', impressions: 'rgba(156, 39, 176, 1)' }"
            labels
          />
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="GraphPercent"
      code="<GraphPercent :value>"
      description="Single-series 0–100 score chart with traffic-light coloring (red / amber / green). Used for Lighthouse-style scores."
    >
      <UCard variant="outline">
        <div class="h-[160px]">
          <GraphPercent :value="lcpSeries" :height="160" />
        </div>
      </UCard>
    </KitSection>

    <KitSection
      title="GraphButtonGroup"
      code="<GraphButtonGroup v-model :buttons>"
      description="Toggleable metric chips that drive which series a chart renders. Underline color matches the series color in the chart."
    >
      <UCard variant="outline">
        <div class="space-y-3">
          <GraphButtonGroup v-model="selected" :buttons="buttons" />
          <div class="text-xs text-dimmed font-mono">
            selected: [{{ selected.join(', ') }}]
          </div>
        </div>
      </UCard>
    </KitSection>
  </div>
</template>

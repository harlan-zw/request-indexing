<script lang="ts" setup>
import type { AnalysisPreset } from '~~/layers/core/app/composables/useGscdump'
import type { SiteSelect } from '#shared/types/database'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Analysis',
  icon: 'i-ph-chart-pie-slice-duotone',
})

// AN1: the card already prints the engine's own description for the active
// preset. These read as tooltips on the buttons instead, so the page never
// shows two different sentences for one view.
const presets: Array<{ key: AnalysisPreset, label: string, icon: string, description: string }> = [
  { key: 'striking-distance', label: 'Striking Distance', icon: 'i-ph-target-duotone', description: 'Keywords ranking 4-20 that could reach page 1' },
  { key: 'opportunity', label: 'Opportunity', icon: 'i-ph-lightning-duotone', description: 'High impression keywords with low CTR' },
  { key: 'movers-rising', label: 'Rising', icon: 'i-ph-chart-line-up-duotone', description: 'Keywords gaining clicks vs previous period' },
  { key: 'movers-declining', label: 'Declining', icon: 'i-ph-chart-line-down-duotone', description: 'Keywords losing clicks vs previous period' },
  { key: 'decay', label: 'Decay', icon: 'i-ph-arrow-bend-down-right-duotone', description: 'Keywords with significant traffic loss' },
  { key: 'zero-click', label: 'Zero Click', icon: 'i-ph-cursor-click-duotone', description: 'High impression keywords with no clicks' },
  { key: 'non-brand', label: 'Non-Brand', icon: 'i-ph-tag-simple-duotone', description: 'Keywords excluding brand terms' },
  { key: 'brand-only', label: 'Brand', icon: 'i-ph-trademark-registered-duotone', description: 'Brand keywords only' },
]

const activePreset = ref<AnalysisPreset>('striking-distance')
const brandTerms = ref('')
const showBrandInput = computed(() => ['non-brand', 'brand-only'].includes(activePreset.value))

// AN2: `Potential` and `Missed Clicks` are counts of clicks, not scores. Say
// so once rather than leaving a bare number in the column.
const estimateColumnPresets: AnalysisPreset[] = ['striking-distance', 'opportunity', 'zero-click']
const showEstimateLegend = computed(() => estimateColumnPresets.includes(activePreset.value))
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center gap-3">
      <CalenderFilter />
    </div>

    <!-- AN5: eight controls loose in a row read as decoration. Group them into
         one bordered control so it reads as a single filter. -->
    <div class="flex flex-wrap gap-1 rounded-lg border border-default p-1">
      <UTooltip v-for="preset in presets" :key="preset.key" :text="preset.description">
        <UButton
          :icon="preset.icon"
          :color="activePreset === preset.key ? 'primary' : 'neutral'"
          :variant="activePreset === preset.key ? 'solid' : 'ghost'"
          size="xs"
          :aria-pressed="activePreset === preset.key"
          @click="activePreset = preset.key"
        >
          {{ preset.label }}
        </UButton>
      </UTooltip>
    </div>

    <div v-if="showBrandInput" class="flex items-center gap-3">
      <!-- `UFormGroup` is the Nuxt UI v2 name. In v4 it renders nothing, so the
           field had no label at all. -->
      <UFormField label="Brand terms" class="w-80" help="Comma-separated brand terms">
        <UInput v-model="brandTerms" class="w-full" placeholder="e.g. acme, acme inc" size="sm" />
      </UFormField>
    </div>

    <p v-if="showEstimateLegend" class="text-xs text-muted">
      Potential and Missed Clicks are estimated clicks for the selected period.
    </p>

    <!-- AN3: Pages, Keywords and Countries put their table and its search
         outside a card. This one wrapped both in a card. -->
    <div class="overflow-x-auto">
      <GscdumpAnalysis
        class="min-w-[44rem] md:min-w-0"
        :site-id="site.gscdumpSiteId"
        :preset="activePreset"
        :brand-terms="brandTerms"
      />
    </div>
  </div>
</template>

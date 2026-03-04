<script lang="ts" setup>
import type { AnalysisPreset } from '~/composables/useGscdump'

const props = defineProps<{ site: any }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Analysis',
  icon: 'i-ph-chart-pie-slice-duotone',
})

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
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center gap-3">
      <div class="border border-dashed rounded-lg">
        <CalenderFilter />
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="preset in presets"
        :key="preset.key"
        :icon="preset.icon"
        :color="activePreset === preset.key ? 'primary' : 'neutral'"
        :variant="activePreset === preset.key ? 'soft' : 'ghost'"
        size="xs"
        @click="activePreset = preset.key"
      >
        {{ preset.label }}
      </UButton>
    </div>

    <div v-if="showBrandInput" class="flex items-center gap-3">
      <UFormGroup label="Brand Terms" class="w-80" description="Comma-separated brand terms">
        <UInput v-model="brandTerms" placeholder="e.g. acme, acme inc" size="sm" />
      </UFormGroup>
    </div>

    <div class="text-sm text-gray-500">
      {{ presets.find(p => p.key === activePreset)?.description }}
    </div>

    <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
      <GscdumpAnalysis
        :site-id="site.gscdumpSiteId"
        :preset="activePreset"
        :brand-terms="brandTerms"
      />
    </UCard>
  </div>
</template>

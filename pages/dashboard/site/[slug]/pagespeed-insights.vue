<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: SiteSelect }>()

const emits = defineEmits<{
  toggleChart: [chart: string]
}>()

definePageMeta({
  layout: 'dashboard',
  title: 'PageSpeed Insights',
  icon: 'i-heroicons-rocket',
})

const siteData = useSiteData(props.site)
const { data: dates } = siteData.psiDates()

const graph = computed(
  () => (dates.value || []),
)

const lastEntry = computed(() => {
  if (!dates?.value?.length)
    return null
  return dates.value[dates.value.length - 1]
})

const tooltipData = ref()
const tooltipEntry = computed(() => {
  if (!tooltipData.value?.time)
    return null
  // find graph with the date = time
  return graph.value.find(row => row.date === tooltipData.value.time)
})

const graphColours = {
  psiMobileScore: {
    topColor: 'rgba(33, 150, 243, 0.9)',
    bottomColor: 'rgba(33, 150, 243, 0.04)',
    lineColor: 'rgba(33, 150, 243, 0.5)',
  },
  psiDesktopScore: {
    topColor: 'rgba(156, 39, 176, 0.4)',
    bottomColor: 'rgba(156, 39, 176, 0.04)',
    lineColor: 'rgba(156, 39, 176, 0.5)',
  },
}
</script>

<template>
  <div class="flex flex-wrap gap-5">
    <div class="grid grid-cols-3 w-full gap-10">
      <UCard>
        <h2 class="mb-2 flex items-center text-sm font-semibold">
          <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
          How it works
        </h2>
        <div class="text-sm text-gray-500 mb-1">
          Every day your top pages will be scanned with the PageSpeed Insights API and the results will appear here.
        </div>
        <div class="text-sm text-gray-500">
          Free users get their top 5 pages scanned on both mobile and desktop.
        </div>
      </UCard>
      <UCard>
        <h2 class="mb-2 flex items-center text-sm font-semibold gap-1">
          <UIcon name="i-ph-desktop-duotone" class="w-5 h-5 text-gray-500" />
          <span>Desktop</span>
          <span>{{ tooltipEntry?.psiDesktopScore }}</span>
        </h2>
        <GraphData height="100" :value="graph!" :columns="['psiDesktopScore']" :colors="graphColours" @tooltip="e => tooltipData = e" />
      </UCard>
      <UCard>
        <h2 class="mb-2 flex items-center text-sm font-semibold gap-1">
          <UIcon name="i-ph-device-mobile-duotone" class="w-5 h-5 mr-1 text-gray-500" />
          <span>Mobile</span>
          <span>{{ tooltipEntry?.psiMobileScore }}</span>
        </h2>
        <GraphData height="100" :value="graph!" :columns="['psiMobileScore']" :colors="graphColours" @tooltip="e => tooltipData = e" />
      </UCard>
    </div>
    <UCard>
      <TablePsi :site="site" />
    </UCard>
  </div>
</template>

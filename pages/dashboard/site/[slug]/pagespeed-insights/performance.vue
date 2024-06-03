<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  layout: 'dashboard',
  title: 'PageSpeed Insights',
  icon: 'i-heroicons-rocket',
})

const siteData = useSiteData(props.site)
const { data: dates } = siteData.psiDates({
  query: {
    device: 'mobile',
  },
})

const graph = computed(
  () => (dates.value || []),
)

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

const tabItems = [
  {
    label: 'Mobile',
    icon: 'i-ph-device-mobile-duotone',
    slot: 'mobile',
  },
  {
    label: 'Desktop',
    icon: 'i-ph-desktop-duotone',
    slot: 'desktop',
  },
]
</script>

<template>
  <div class="">
    <h2 class="text-2xl mb-2">
      Performance Drilldown
    </h2>
    <UTabs :items="tabItems" class="">
      <template #default="{ item }">
        <div class="flex items-center gap-2 relative truncate min-w-[150px] justify-center">
          <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span class="truncate">{{ item.label }}</span>
        </div>
      </template>
      <template #mobile>
        <div class="grid grid-cols-3 w-full gap-10">
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
          <TablePsiPerformance :site="site" />
        </UCard>
      </template>
      <template #desktop>
        <div class="grid grid-cols-3 w-full gap-10">
          <UCard>
            <h2 class="mb-2 flex items-center text-sm font-semibold gap-1">
              <UIcon name="i-ph-desktop-duotone" class="w-5 h-5 text-gray-500" />
              <span>Desktop</span>
              <span>{{ tooltipEntry?.psiDesktopScore }}</span>
            </h2>
            <GraphData height="100" :value="graph!" :columns="['psiDesktopScore']" :colors="graphColours" @tooltip="e => tooltipData = e" />
          </UCard>
        </div>
        <UCard>
          <TablePsiPerformance :site="site" />
        </UCard>
      </template>
    </UTabs>
  </div>
</template>

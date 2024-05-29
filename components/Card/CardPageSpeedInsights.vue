<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'
import type { SiteSelect } from '~/server/database/schema'

const props = defineProps<{
  site: SiteSelect
  selectedCharts: string[]
}>()

// const emits = defineEmits<{
//   toggleChart: [chart: string]
// }>()

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
</script>

<template>
  <div class="flex gap-3 mt-2 transition group hover:bg-gray-50 rounded flex text-[11px] flex items-center gap-1 text-gray-500/80 gap-2 items-end">
    PageSpeed Insights
    <NuxtLink to="/" class="transition group hover:bg-gray-50 rounded flex text-[11px] flex items-center gap-1 text-gray-500/80 gap-2 items-end ">
      <div class="flex gap-1">
        <UIcon name="i-ph-device-mobile-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
        <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
          Mobile
        </div>
      </div>
      <div class="flex items-center gap-1">
        {{ useHumanFriendlyNumber(typeof tooltipEntry?.psiMobileScore !== 'undefined' ? tooltipEntry.psiMobileScore : lastEntry?.psiMobileScore) }}
      </div>
    </NuxtLink>

    <NuxtLink to="/" class="transition group hover:bg-gray-50 rounded flex text-[11px] flex items-center gap-1 text-gray-500/80 gap-2 items-end ">
      <div class="flex gap-1">
        <UIcon name="i-ph-desktop-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
        <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
          Desktop
        </div>
      </div>
      <div class="flex items-center gap-1">
        {{ useHumanFriendlyNumber(typeof tooltipEntry?.psiDesktopScore !== 'undefined' ? tooltipEntry.psiDesktopScore : lastEntry?.psiDesktopScore) }}
      </div>
    </NuxtLink>
  </div>
</template>

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

function formatPageSpeedInsightScore(score: number) {
  // return a tailwind color for the score
  if (score >= 90)
    return 'text-green-500'
  if (score >= 50)
    return 'text-yellow-600'
  return 'text-red-500'
}
</script>

<template>
  <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/pagespeed-insights`" class="transition rounded group hover:bg-gray-100 flex group text-[11px] items-center text-gray-500/80 gap-2 px-2">
    <div>PageSpeed Insights</div>
    <div class=" px-2 py-1 rounded text-[11px] flex items-center gap-1 text-gray-500/80 ">
      <div class="flex gap-1">
        <UIcon name="i-ph-device-mobile-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
        <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
          Mobile
        </div>
      </div>
      <div class="flex items-center gap-1 font-bold" :class="formatPageSpeedInsightScore(lastEntry?.psiMobileScore)">
        {{ useHumanFriendlyNumber(typeof tooltipEntry?.psiMobileScore !== 'undefined' ? tooltipEntry.psiMobileScore : lastEntry?.psiMobileScore) }}
      </div>
    </div>

    <div class=" px-2 py-1 rounded text-[11px] flex items-center gap-1 text-gray-500/80 ">
      <div class="flex gap-1">
        <UIcon name="i-ph-desktop-duotone" class="w-4 h-4 opacity-80 text-gray-500" />
        <div class="text-[11px] flex items-center text-gray-500/80">
          Desktop
        </div>
      </div>
      <div class="flex items-center font-bold" :class="formatPageSpeedInsightScore(lastEntry?.psiDesktopScore)">
        {{ useHumanFriendlyNumber(typeof tooltipEntry?.psiDesktopScore !== 'undefined' ? tooltipEntry.psiDesktopScore : lastEntry?.psiDesktopScore) }}
      </div>
    </div>
  </NuxtLink>
</template>

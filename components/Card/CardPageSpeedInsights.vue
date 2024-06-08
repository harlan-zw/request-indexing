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

</template>

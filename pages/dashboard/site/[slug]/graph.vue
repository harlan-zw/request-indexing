<script lang="ts" setup>
import { exponentialMovingAverage } from '~/lib/time-smoothing/exponentialMovingAverage'
import { simpleMovingAverage } from '~/lib/time-smoothing/simpleMovingAverage'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Graph',
  icon: 'i-heroicons-chart-bar',
})

useHead({
  title: 'Graph',
})

const { session } = useUserSession()

const siteData = useSiteData(props.site)
const { data: dates } = siteData.dates()

const graph = computed(() => {
  if (!dates.value?.rows?.length)
    return []
  const rows = dates.value.rows
  const _dates = rows.map(row => row.time)
  let clicks = rows.map(row => row.clicks)
  let impressions = rows.map(row => row.impressions)
  let position = rows.map(row => row.position)
  let ctr = rows.map(row => row.ctr)
  let smoothLineFn = (x: number[]) => x
  if (session.value.smoothLines === 'ema')
    smoothLineFn = exponentialMovingAverage
  else if (session.value.smoothLines === 'sma')
    smoothLineFn = simpleMovingAverage
  clicks = smoothLineFn(clicks)
  impressions = smoothLineFn(impressions)
  position = smoothLineFn(position)
  ctr = smoothLineFn(ctr)
  return {
    key: `${session.value.smoothLines}-${session.value.metricFilter}`,
    clicks: clicks.map((value, index) => ({ time: _dates[index], value })),
    impressions: impressions.map((value, index) => ({ time: _dates[index], value })),
    position: position.map((value, index) => ({ time: _dates[index], value })),
    ctr: ctr.map((value, index) => ({ time: _dates[index], value: value * 100 })),
  }
})
</script>

<template>
  <div>
    <UPageHeader headline="Your Site">
      <template #title>
        <div class="flex items-center gap-3">
          <UIcon :name="$route.meta.icon" />
          {{ $route.meta.title }}
        </div>
      </template>
      <template #links />
    </UPageHeader>
    <UPageBody>
      <div class="relative">
        <ExpandedGraph v-if="graph" v-bind="graph" :height="500" />
      </div>
    </UPageBody>
  </div>
</template>

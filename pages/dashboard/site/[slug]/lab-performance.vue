<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Lab Performance',
  icon: 'i-ph-speedometer-duotone',
})

const connector = ref()
provide('tableAsyncDataProvider', connector)

const tab = ref(0)

function getLastEntrySynthetic(key: string, allowZero?: boolean) {
  if (!connector.value?.syntheticWebVitals?.length)
    return null
  key = `${tab.value === 0 ? 'mobile' : 'desktop'}${key}`
  for (let i = connector.value.syntheticWebVitals.length - 1; i >= 0; i--) {
    if (connector.value.syntheticWebVitals[i][key] || (allowZero && connector.value.syntheticWebVitals[i][key] !== null)) {
      return connector.value.syntheticWebVitals[i][key]
    }
  }
}
const psiDates = ref([])
onMounted(async () => {
  psiDates.value = await $fetch(`/api/sites/${props.site.siteId}/psi-dates`)
})
const lastPsiEntry = computed(() => {
  return psiDates.value[psiDates.value.length - 1]
})
</script>

<template>
<div class="space-y-7">
  <UAlert

    :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
    title="Lab performance is synthetic data"
  >
    <template #description>
    <div class="text-sm">
      This data is generated from PageSpeed Insights which uses a simulated environment to test your website. This data is not real world data and should as a single source to improve your site.
    </div>
    </template>
  </UAlert>

  <div class="flex items-center gap-3">
    <div class="border border-dashed rounded-lg">
      <div class="max-w-sm">
        <UPopover :popper="{ placement: 'bottom-end' }">
          <template #default="{ open }">
          <UButton size="xs" color="gray" icon="i-ph-device-mobile-duotone" variant="ghost" :class="[open && 'bg-gray-50 dark:bg-gray-800']" trailing-icon="i-heroicons-chevron-down-20-solid">
            <span class="truncate">Mobile</span>
          </UButton>
          </template>
        </UPopover>
      </div>
    </div>
    <div class="border border-dashed rounded-lg">
      <CalenderFilter />
    </div>
  </div>
  <div class="space-y-7">
    <div v-if="lastPsiEntry" class="grid grid-cols-3 gap-5">
      <div>
        <div class="text-sm mb-1 font-semibold text-gray-600">
          Mobile Performance
        </div>
        <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
          <div class="flex items-center gap-5">
            <div class="w-[100px]">
              <div>
                <span class="font-mono text-4xl">{{ useHumanFriendlyNumber(lastPsiEntry.psiMobilePerformance) }}</span>
                <LighthouseBenchmark :value="lastPsiEntry.psiMobilePerformance" />
              </div>
            </div>
            <div class="h-[66px] w-[75px]">
              <GraphLighthouseScore height="66" :value="psiDates.map(r => ({ time: r.date, value: r.psiMobilePerformance }))" />
            </div>
          </div>
        </UCard>
      </div>
    </div>
    <div v-if="connector?.syntheticWebVitals?.length">
      <CardTitle>Synthetic Origin Web Vitals</CardTitle>
      <div :key="tab" class="grid grid-cols-3 w-full gap-5">
        <WebVital
          id="first-contentful-paint"
          :value="getLastEntrySynthetic('Fcp')"
          :graph="connector.syntheticWebVitals.map(r => ({ time: r.date, value: tab === 0 ? r.mobileFcp : r.desktopFcp })).filter(r => r.value)"
        />
        <WebVital
          id="largest-contentful-paint"
          :value="getLastEntrySynthetic('Lcp')"
          :graph="connector.syntheticWebVitals.map(r => ({ time: r.date, value: tab === 0 ? r.mobileLcp : r.desktopLcp })).filter(r => r.value)"
        />
        <WebVital
          id="total-blocking-time"
          :value="getLastEntrySynthetic('Tbt')"
          :graph="connector.syntheticWebVitals.map(r => ({ time: r.date, value: tab === 0 ? r.mobileTbt : r.desktopTbt })).filter(r => r.value)"
        />
        <WebVital
          id="cumulative-layout-shift"
          :value="getLastEntrySynthetic('Cls', true)"
          :graph="connector.syntheticWebVitals.map(r => ({ time: r.date, value: tab === 0 ? r.mobileCls : r.desktopCls }))"
        />
        <WebVital
          id="speed-index"
          :value="getLastEntrySynthetic('Si')"
          :graph="connector.syntheticWebVitals.map(r => ({ time: r.date, value: tab === 0 ? r.mobileSi : r.desktopSi }))"
        />
      </div>
    </div>
    <div>
      <CardTitle>
        Pages
      </CardTitle>
      <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
        <TablePsiPerformance :page-size="5" :sort="{ column: tab === 0 ? 'psiMobilePerformance' : 'psiDesktopPerformance', direction: 'asc' }" :pagination="false" :filters="[]" :searchable="false" :sortable="false" :exclude-columns="['actions']" :expandable="false" :site="site" :device="tab === 0 ? 'mobile' : 'desktop'" />
      </UCard>
    </div>
  </div>
</div>
</template>

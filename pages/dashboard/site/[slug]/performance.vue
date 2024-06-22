<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'
import { formatPageSpeedInsightScore } from '~/composables/formatting'

defineProps<{ site: SiteSelect }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Field Performance',
  icon: 'i-ph-speedometer-duotone',
})

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
const connector = ref()
provide('tableAsyncDataProvider', connector)

const tab = ref(0)

function getLastEntryCrux(key: string, allowZero?: boolean) {
  if (!connector.value.crux?.length)
    return null
  key = `${tab.value === 0 ? 'mobileOrigin' : 'desktopOrigin'}${key}`
  for (let i = connector.value.crux.length - 1; i >= 0; i--) {
    if (connector.value.crux[i][key] || (allowZero && connector.value.crux[i][key] !== null)) {
      return connector.value.crux[i][key]
    }
  }
}

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
</script>

<template>
<div class="space-y-7">
  <UAlert

    :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
    title="Field performance is real world user data"
  >
    <template #description>
    <div class="text-sm">
      This data is collected from the <a class="underline" href="https://developer.chrome.com/docs/crux/api" target="_blank">Chrome User Experience Report</a>, which is a public dataset of key user experience metrics for popular destinations on the web, as experienced by Chrome users under real-world conditions.
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
    <div class="border border-dashed rounded-lg">
      <LocationFilter />
    </div>
  </div>
  <div class="space-y-10">
    <div v-if="connector?.crux?.length">
      <CardTitle>Real-world Origin Web Vitals</CardTitle>
      <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
        <div :key="tab" class="grid grid-cols-3 w-full gap-5">
          <WebVital
            id="largest-contentful-paint"
            :value="getLastEntryCrux('Lcp75')"
            :graph="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginLcp75 : r.desktopOriginLcp75 })).filter(r => r.value)"
          />
          <WebVital
            id="interaction-next-paint"
            :value="getLastEntryCrux('Inp75')"
            :graph="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginInp75 : r.desktopOriginInp75 })).filter(r => r.value)"
          />
          <WebVital
            id="cumulative-layout-shift"
            :value="getLastEntryCrux('Cls75', true)"
            :graph="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginCls75 : r.desktopOriginCls75 }))"
          />
          <WebVital
            id="first-contentful-paint"
            :value="getLastEntryCrux('Fcp75')"
            :graph="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginFcp75 : r.desktopOriginFcp75 })).filter(r => r.value)"
          />
          <WebVital
            id="time-to-first-byte"
            :value="getLastEntryCrux('Ttfb75')"
            :graph="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginTtfb75 : r.desktopOriginTtfb75 })).filter(r => r.value)"
          />
        </div>
      </UCard>
    </div>
    <div>
      <CardTitle>Real-world Page Web Vitals</CardTitle>
      <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
        <TableCruxPerformance :page-size="8" :sort="{ column: tab === 0 ? 'mobileCls75' : 'mobileCls75', direction: 'asc' }" :filters="[]" :searchable="false" :sortable="false" :exclude-columns="['actions']" :expandable="false" :site="site" :device="tab === 0 ? 'mobile' : 'desktop'" />
      </UCard>
    </div>
  </div>
</div>
</template>

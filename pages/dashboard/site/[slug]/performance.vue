<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'
import { formatPageSpeedInsightScore } from '~/composables/formatting'

defineProps<{ site: SiteSelect }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Performance',
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

function getLastEntry(key: string, allowZero?: boolean) {
  if (!connector.value.crux?.length)
    return null
  key = `${tab.value === 0 ? 'mobileOrigin' : 'desktopOrigin'}${key}`
  for (let i = connector.value.crux.length - 1; i >= 0; i--) {
    if (connector.value.crux[i][key] || (allowZero && connector.value.crux[i][key] !== null)) {
      return connector.value.crux[i][key]
    }
  }
}
</script>

<template>
  <div class="">
    <div class="max-w-sm mb-10">
      <UTabs v-model="tab" :items="tabItems">
        <template #default="{ item }">
          <div class="flex items-center gap-2 relative truncate min-w-[150px] justify-center">
            <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">{{ item.label }}</span>
          </div>
        </template>
      </UTabs>
    </div>
    <div class="grid grid-cols-12 gap-12">
      <div class="col-span-8 space-y-5">
        <div v-if="connector?.crux?.length">
          <div class="mb-3">
            <div class="font-bold text-base mb-1">
              Field web vitals
            </div>
            <div class="max-w-4xl mb-5 text-sm text-gray-500">
              This data is collected from the Chrome User Experience Report, which is a public dataset of key user experience metrics for popular destinations on the web, as experienced by Chrome users under real-world conditions.
            </div>
          </div>
          <div :key="tab" class="grid grid-cols-3 w-full gap-5 mb-12">
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  Largest Contentful Paint
                </div>
                <div>
                  <PsiUnit :value="getLastEntry('Lcp75')" />
                  <PsiBenchmark :value="getLastEntry('Lcp75')" :fast="2500" :moderate="4000" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphLcp :value="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginLcp75 : r.desktopOriginLcp75 })).filter(r => r.value !== 0)" />
              </UCard>
            </div>
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  Interaction Next Paint
                </div>
                <div>
                  <PsiUnit :value="getLastEntry('Inp75')" />
                  <PsiBenchmark :value="getLastEntry('Inp75')" :fast="200" :moderate="500" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphInp :value="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginInp75 : r.desktopOriginInp75 })).filter(r => r.value)" />
              </UCard>
            </div>
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  Cumulative Layout Shift (CLS)
                </div>
                <div>
                  <PsiUnit :value="getLastEntry('Cls75', true)" unitless />
                  <PsiBenchmark :value="getLastEntry('Cls75', true)" :fast="0.1" :moderate="0.25" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphCls :value="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginCls75 : r.desktopOriginCls75 }))" />
              </UCard>
            </div>
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  First Contentful Paint
                </div>
                <div>
                  <PsiUnit :value="getLastEntry('Fcp75')" />
                  <PsiBenchmark :value="getLastEntry('Fcp75')" :fast="1800" :moderate="3000" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphFcp :value="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginFcp75 : r.desktopOriginFcp75 })).filter(r => r.value)" />
              </UCard>
            </div>
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  Time to first byte
                </div>
                <div>
                  <PsiUnit :value="getLastEntry('Ttfb75')" />
                  <PsiBenchmark :value="getLastEntry('Ttfb75')" :fast="800" :moderate="1800" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphTtfb :value="connector.crux.map(r => ({ time: r.date, value: tab === 0 ? r.mobileOriginTtfb75 : r.desktopOriginTtfb75 })).filter(r => r.value)" />
              </UCard>
            </div>
          </div>
        </div>
        <div>
          <div class="flex items-center mb-3 gap-3">
            <div class="text-sm font-bold">
              Slowest Pages
            </div>
            <NuxtLink :to="`/dashboard/site/${site.siteId}/keywords`" class="text-[11px] hover:underline font-normal">
              View All
            </NuxtLink>
          </div>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <TablePsiPerformance :page-size="5" :sort="{ column: tab === 0 ? 'psiMobilePerformance' : 'psiDesktopPerformance', direction: 'asc' }" :pagination="false" :filters="[]" :searchable="false" :sortable="false" :exclude-columns="['actions']" :expandable="false" :site="site" :device="tab === 0 ? 'mobile' : 'desktop'" />
          </UCard>
        </div>
      </div>
      <div class="col-span-4 space-y-5">
        <div>
          <div v-if="connector?.totals">
            <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
              <div class="text-4xl font-bold">
                3.2s
              </div>
              <div class="text-sm">
                Total Average Time To Byte
              </div>
            </UCard>
          </div>
        </div>
        <div>
          <UCard v-if="connector?.totals" :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <div class="text-4xl font-bold">
              <div v-if="tab === 0" :class="formatPageSpeedInsightScore(connector.totals.totalAvgMobile)">
                {{ useHumanFriendlyNumber(connector.totals.totalAvgMobile) }}
              </div>
              <div v-else :class="formatPageSpeedInsightScore(connector.totals.totalAvgDesktop)">
                {{ useHumanFriendlyNumber(connector.totals.totalAvgDesktop) }}
              </div>
            </div>
            <div class="text-sm">
              Total Average Performance Score
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

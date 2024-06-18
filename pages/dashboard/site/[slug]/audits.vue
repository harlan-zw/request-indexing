<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Audits',
  icon: 'i-heroicons-rocket',
})

// const siteData = useSiteData(props.site)
// const { data: dates } = siteData.psiDates({
//   query: {
//     device: 'mobile',
//   },
// })

const onDemandScanState = reactive({
  path: '',
})

const formLoading = ref(false)

const toast = useToast()

async function submit() {
  formLoading.value = true
  await $fetch(`/api/sites/${props.site.siteId}/psi`, {
    method: 'POST',
    body: JSON.stringify({
      path: onDemandScanState.path,
    }),
  }).finally(() => {
    formLoading.value = false
  }).then(() => {
    toast.add({
      title: 'Scan requested',
      description: 'The scan has been requested and will appear here shortly.',
    })
  })
}

const psiDates = ref([])
onMounted(async () => {
  psiDates.value = await $fetch(`/api/sites/${props.site.siteId}/psi-dates`).then((dates) => {
    // if dates length is 0, then seed a fake date for yesterday
    if (dates.length === 1) {
      return [
        { date: '2024-06-15', psiMobileAccessibility: 0, psiMobileBestPractices: 0, psiMobilePerformance: 0, psiMobileSeo: 0 },
        dates[0],
      ]
    }
    return dates
  })
})
const lastPsiEntry = computed(() => {
  return psiDates.value[psiDates.value.length - 1]
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

const groups = computed(() => ([
  {
    label: 'Performance',
    filter: 'performance',
    key: tab.value === 0 ? 'psiMobilePerformance' : 'psiDesktopPerformance',
  },
  {
    label: 'Accessibility',
    filter: 'accessibility',
    key: tab.value === 0 ? 'psiMobileAccessibility' : 'psiDesktopAccessibility',
  },
  {
    label: 'Best Practices',
    filter: 'best-practices',
    key: tab.value === 0 ? 'psiMobileBestPractices' : 'psiDesktopBestPractices',
  },
  {
    label: 'SEO',
    filter: 'seo',
    key: tab.value === 0 ? 'psiMobileSeo' : 'psiDesktopSeo',
  },
]))
</script>

<template>
  <div class="">
    <div class="max-w-sm mb-7">
      <UTabs v-model="tab" :items="tabItems">
        <template #default="{ item }">
          <div class="flex items-center gap-2 relative truncate min-w-[150px] justify-center">
            <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">{{ item.label }}</span>
          </div>
        </template>
      </UTabs>
    </div>
    <div v-if="lastPsiEntry" class="grid grid-cols-3 w-full gap-10">
      <div class="col-span-2">
        <div class="grid grid-cols-4 gap-3 mb-10">
          <div v-for="group in groups">
            <div class="text-xs mb-2 font-semibold text-gray-600">
              {{ group.label }}
            </div>
            <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
              <div class="flex gap-5 mb-3">
                <div class="w-[100px]">
                  <div>
                    <span class="font-mono text-3xl">{{ useHumanFriendlyNumber(lastPsiEntry[group.key]) }}</span>
                    <LighthouseBenchmark :value="lastPsiEntry[group.key]" />
                  </div>
                </div>
                <div class="h-[50px] w-[75px]">
                  <GraphLighthouseScore height="75" :value="psiDates.map(r => ({ time: r.date, value: r[group.key] }))" />
                </div>
              </div>
            </UCard>
          </div>
        </div>
        <h2 class="mb-3 font-semibold">Audits</h2>
        <div class="space-y-5">
        <div v-for="group in groups">
          <div class="text-xs font-semibold text-gray-600 mb-2">
            {{ group.label }}
          </div>
          <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
            <TablePsiAudits
                class="min-w-0 flex-grow max-w-full"
                :exclude-columns="['actions', 'score', 'weight']"
                :page-size="3"
                :filter="group.filter"
                :searchable="false"
                :expandable="false"
                :sortable="false"
                :filters="[]"
                :site="site"
              />
          </UCard>
        </div>
        </div>
      </div>
      <div class="col-span-1 space-y-7">
        <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
          <h2 class="mb-2 flex items-center text-sm font-semibold">
            <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
            How it works
          </h2>
          <div class="text-sm text-gray-500 mb-1">
            Every day your top pages will be scanned with the PageSpeed Insights API and the results will appear here.
          </div>
        </UCard>
        <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
          <h2 class="mb-2 flex items-center text-sm font-semibold">
            <UIcon name="i-ph-caret-double-right-duotone" class="w-5 h-5 mr-1 text-gray-500" />
            Run on-demand scans
          </h2>
          <div class="text-sm text-gray-500">
            You can request individual pages to be scanned on the <NuxtLink to="/" class="underline">
              Pages dashboard
            </NuxtLink>.
          </div>
          <UForm :state="onDemandScanState" class="flex items-end gap-3" @submit="submit">
            <UFormGroup label="Path" class="mt-3 grow">
              <UInput v-model="onDemandScanState.path" :loading="formLoading" />
            </UFormGroup>
            <div>
              <UButton type="submit" size="sm" color="gray">
                Run
              </UButton>
            </div>
          </UForm>
        </UCard>
      </div>
    </div>
    <div class="my-10 space-y-10">
      <div class="flex gap-2 items-center">
        <h2 class="text-2xl mb-2">
          Overview
        </h2>
        <div class="text-xs text-gray-500">
          Average scores for the <span class="underline font-semibold">last 30 days</span>.
        </div>
      </div>
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <TablePsiOverview :site="site" />
      </UCard>
      <div class="flex gap-2 items-center">
        <h2 class="text-2xl mb-2">
          Overview
        </h2>
        <div class="text-xs text-gray-500">
          Average scores for the <span class="underline font-semibold">last 30 days</span>.
        </div>
      </div>
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <TablePsiAudits :page-size="5" :sort="{ column: tab === 0 ? 'psiMobilePerformance' : 'psiDesktopPerformance', direction: 'asc' }" :pagination="false" :filters="[]" :searchable="false" :sortable="false" :exclude-columns="['actions']" :expandable="false" :site="site" :device="tab === 0 ? 'mobile' : 'desktop'" />
      </UCard>
    </div>
    <div>
      <div class="flex items-center mb-3 gap-3">
        <div class="text-sm font-bold">
          Worst Pages
        </div>
        <NuxtLink :to="`/dashboard/site/${site.siteId}/keywords`" class="text-[11px] hover:underline font-normal">
          View All
        </NuxtLink>
      </div>
      <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
        <TablePsiAudits :page-size="5" :sort="{ column: tab === 0 ? 'psiMobilePerformance' : 'psiDesktopPerformance', direction: 'asc' }" :pagination="false" :filters="[]" :searchable="false" :sortable="false" :exclude-columns="['actions']" :expandable="false" :site="site" :device="tab === 0 ? 'mobile' : 'desktop'" />
      </UCard>
    </div>
  </div>
</template>

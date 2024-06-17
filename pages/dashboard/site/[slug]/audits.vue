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
  psiDates.value = await $fetch(`/api/sites/${props.site.siteId}/psi-dates`)
})
const lastPsiEntry = computed(() => {
  return psiDates.value[0]
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
    <div class="grid grid-cols-3 w-full gap-10">
      <UCard>
        <h2 class="mb-2 flex items-center text-sm font-semibold">
          <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
          How it works
        </h2>
        <div class="text-sm text-gray-500 mb-1">
          Every day your top pages will be scanned with the PageSpeed Insights API and the results will appear here.
        </div>
      </UCard>
      <UCard>
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
    <div v-if="lastPsiEntry" class="grid grid-cols-12 gap-10 my-12">
      <div class="col-span-2">
        <div class="mb-2">
          <div class="text-sm font-bold">
            Accessibility
          </div>
          <div>
            <span class="font-mono text-3xl">{{ lastPsiEntry.psiMobileAccessibility }}</span>
            <LighthouseBenchmark :value="lastPsiEntry.psiMobileAccessibility" />
          </div>
        </div>
      </div>
      <div class="col-span-6">
        <TablePsiAudits :exclude-columns="['actions']" :searchable="false" :expandable="false" :sortable="false" :filters="[]" :site="site" />
      </div>
    </div>
    <div v-if="lastPsiEntry" class="grid grid-cols-12">
      <div class="col-span-8 space-y-5">
        <div>
          <div class="my-3">
            <div class="font-bold text-base mb-1">
              Lighthouse Scores
            </div>
            <div class="max-w-4xl mb-5 text-sm text-gray-500">
              This data is collected from the Chrome User Experience Report, which is a public dataset of key user experience metrics for popular destinations on the web, as experienced by Chrome users under real-world conditions.
            </div>
          </div>
          <div class="grid grid-cols-4 w-full gap-5 mb-12">
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  Performance
                </div>
                <div>
                  <PsiUnit :value="lastPsiEntry.psiMobilePerformance" unitless />
                  <LighthouseBenchmark :value="lastPsiEntry.psiMobilePerformance" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphInp :value="psiDates.map(r => ({ time: r.date, value: r.psiMobilePerformance }))" />
              </UCard>
            </div>
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  Accessibility
                </div>
                <div>
                  <PsiUnit :value="lastPsiEntry.psiMobileAccessibility" unitless />
                  <LighthouseBenchmark :value="lastPsiEntry.psiMobileAccessibility" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphInp :value="psiDates.map(r => ({ time: r.date, value: r.psiMobileAccessibility }))" />
              </UCard>
            </div>
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  Best Practices
                </div>
                <div>
                  <PsiUnit :value="lastPsiEntry.psiMobileBestPractices" unitless />
                  <LighthouseBenchmark :value="lastPsiEntry.psiMobileBestPractices" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphInp :value="psiDates.map(r => ({ time: r.date, value: r.psiMobileBestPractices }))" />
              </UCard>
            </div>
            <div>
              <div class="flex items-center mb-2 justify-between">
                <div class="text-xs font-bold">
                  SEO
                </div>
                <div>
                  <PsiUnit :value="lastPsiEntry.psiMobileSeo" unitless />
                  <LighthouseBenchmark :value="lastPsiEntry.psiMobileSeo" />
                </div>
              </div>
              <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
                <CruxGraphInp :value="psiDates.map(r => ({ time: r.date, value: r.psiMobileSeo }))" />
              </UCard>
            </div>
          </div>
        </div>
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
      <UCard>
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
      <UCard>
        <TablePsiAudits :site="site" />
      </UCard>
    </div>
  </div>
</template>

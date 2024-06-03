<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  layout: 'dashboard',
  title: 'PageSpeed Insights',
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
</script>

<template>
  <div class="">
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
    <div class="my-10">
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
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: any, siteLoader: any, slug: string }>()

definePageMeta({
  title: 'CrUX',
  icon: 'i-heroicons-users',
})

const siteData = useSiteData(props.site)
const { data: crux } = siteData.crux()

useHead({
  title: 'CrUX',
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
      <UCard>
        <template #header>
          <h2 class="font-bold">
            Historical Origin CrUX
          </h2>
        </template>
        <div v-if="crux?.exists === false" class="w-full">
          <div class="text-gray-500 text-center w-full text-sm">
            No data from Chrome UX report
          </div>
        </div>
        <div v-else class="w-full flex-col flex ">
          <div>INP</div>
          <div v-if="crux?.inp" class="w-full h-[200px] relative">
            <CruxGraphInp v-if="crux?.inp" :value="crux.inp" />
          </div>
          <div>CLS</div>
          <div v-if="crux?.cls" class="w-full h-[200px] relative">
            <CruxGraphCls v-if="crux?.cls" :value="crux.cls" />
          </div>
          <div>LCP</div>
          <div v-if="crux?.lcp" class="w-full h-[200px] relative">
            <CruxGraphLcp v-if="crux?.lcp" :value="crux.lcp" />
          </div>
        </div>
      </UCard>
    </UPageBody>
  </div>
</template>

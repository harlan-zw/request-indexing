<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'

defineProps<{ site: SiteSelect }>()

definePageMeta({
  layout: 'dashboard',
  title: 'PageSpeed Insights',
  icon: 'i-heroicons-rocket',
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

const tab = ref(0)
</script>

<template>
  <div class="">
    <h2 class="text-2xl mb-2">
      Performance Drilldown
    </h2>
    <UTabs v-model="tab" :items="tabItems">
      <template #default="{ item }">
        <div class="flex items-center gap-2 relative truncate min-w-[150px] justify-center">
          <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span class="truncate">{{ item.label }}</span>
        </div>
      </template>
    </UTabs>
    <div>tab: {{ tab }}</div>
    <div class="grid grid-cols-3 w-full gap-10">
      <UCard v-if="tab === 0">
        <h2 class="mb-2 flex items-center text-sm font-semibold gap-1">
          <UIcon name="i-ph-device-mobile-duotone" class="w-5 h-5 mr-1 text-gray-500" />
          <span />
        </h2>
      </UCard>
      <UCard v-else>
        <h2 class="mb-2 flex items-center text-sm font-semibold gap-1">
          <UIcon name="i-ph-desktop-duotone" class="w-5 h-5 text-gray-500" />
          <span>Desktop</span>
        </h2>
      </UCard>
    </div>
    <UCard>
      <TablePsiPerformance :site="site" :device="tab === 0 ? 'mobile' : 'desktop'" />
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Pages',
  icon: 'i-heroicons-folder',
  description: 'See how your sites organic Google traffic is performing.',
})

const siteData = useSiteData(props.site)
const { data: pages } = siteData.pages()
useHead({
  title: 'Pages',
})
</script>

<template>
  <div>
    <div v-if="pages">
      <div class="text-2xl font-bold flex gap-2 items-center">
        {{ useHumanFriendlyNumber(pages.periodCount) }}  <span class="font-normal text-sm">Pages</span>
      </div>
      <TrendPercentage :value="pages.periodCount" :prev-value="pages.prevPeriodCount" />
    </div>
    <div class="grid grid-cols-4">
      <TablePages class="col-span-3" :value="pages?.rows" :site="site" />
    </div>
  </div>
</template>

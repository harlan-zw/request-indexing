<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: any, siteLoader: any, slug: string }>()

definePageMeta({
  title: 'Pages',
  icon: 'i-heroicons-folder',
})

const siteData = useSiteData(props.site)
const { data: pages } = siteData.pages()
useHead({
  title: 'Pages',
})
</script>

<template>
<div>
  <UCard v-if="pages" :ui="{ body: { padding: 'px-3 py-1' } }">
    <div class="text-2xl font-bold flex gap-2 items-center">
      {{ useHumanFriendlyNumber(pages.periodCount) }}  <span class="font-normal text-sm">Pages</span>
    </div>
    <TrendPercentage :value="pages.periodCount" :prev-value="pages.prevPeriodCount" />
  </UCard>
  <UCard>
    <TablePages :value="pages?.rows" :site="site" />
  </UCard>
</div>
</template>

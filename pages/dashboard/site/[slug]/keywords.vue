<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Keywords',
  icon: 'i-heroicons-magnifying-glass-circle',
})

const siteData = useSiteData(props.site)
const { data: keywords } = siteData.keywords()

useHead({
  title: 'Keywords',
})
</script>

<template>
  <UCard v-if="keywords" :ui="{ body: { padding: 'px-3 py-1' } }">
    <div class="text-2xl font-bold flex gap-2 items-center">
      {{ useHumanFriendlyNumber(keywords.periodCount) }}  <span class="font-normal text-sm">Keywords</span>
    </div>
    <TrendPercentage :value="keywords.periodCount" :prev-value="keywords.prevPeriodCount" />
  </UCard>
  <UCard>
    <TableKeywords :value="keywords?.rows || []" :site="site" />
  </UCard>
</template>

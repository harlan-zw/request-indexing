<script lang="ts" setup>
import type { SiteSelect } from '~/server/database/schema'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Pages',
  icon: 'i-heroicons-folder',
})
const siteData = useSiteData(props.site)
const { data: dates } = siteData.dateAnalytics()
</script>

<template>
<div class="space-y-7">
  <div class="flex items-center gap-3">
    <div class="border border-dashed rounded-lg">
      <CalenderFilter />
    </div>
    <div class="border border-dashed rounded-lg">
      <LocationFilter />
    </div>
  </div>
  <CardGoogleSearchConsole v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
  <TablePagesNext :site="site" :page-size="12" :exclude-columns="['psiScore']" />
  <!--      <div> -->
  <!--        <div class="text-2xl font-bold flex gap-2 items-center"> -->
  <!--          {{ useHumanFriendlyNumber(pages.periodCount) }}  <span class="font-normal text-sm">Pages</span> -->
  <!--        </div> -->
  <!--        <TrendPercentage :value="pages.periodCount" :prev-value="pages.prevPeriodCount" /> -->
  <!--      </div> -->
  <!--      <div class="grid grid-cols-4"> -->
  <!-- &lt;!&ndash;        <TablePages class="col-span-3" :value="pages?.rows" :site="site" />&ndash;&gt; -->
  <!--      </div> -->
  <!--      <div v-if="pagesDb" class="grid grid-cols-4"> -->
  <!--        <TablePagesNext class="col-span-3" :value="pagesDb?.rows" :site="site" /> -->
  <!--      </div> -->
</div>
</template>

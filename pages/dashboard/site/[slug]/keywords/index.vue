<script lang="ts" setup>
import {useSiteData} from "~/composables/fetch";

const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Keywords',
  icon: 'i-heroicons-magnifying-glass-circle',
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
  <TableKeywordsNext :site="site" :page-size="12" />
</div>
</template>

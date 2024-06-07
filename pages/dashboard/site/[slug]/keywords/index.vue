<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Keywords',
  icon: 'i-heroicons-magnifying-glass-circle',
})

const siteData = useSiteData(props.site)
const { data: dates } = siteData.dateAnalytics()
</script>

<template>
  <div>
    <div class="grid grid-cols-3 w-full gap-10 mb-10">
      <UCard>
        <CardKeywords v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['keywords']" />
      </UCard>
      <UCard>
        <div class="flex flex-col justify-center">
          <GraphButtonGroup :buttons="buttons" :model-value="['pages']" class="px-2">
            <template #pages-icon>
              <IconClicks class="w-4 h-4 opacity-80" />
            </template>
            <template #pages-trend>
            <!--            <TrendPercentage v-if="!tooltipData && period" compact :value="period.clicks" :prev-value="prevPeriod?.clicks" /> -->
            </template>
          </GraphButtonGroup>
          <GraphData :value="graph!" :columns="['pages']" @tooltip="e => tooltipData = e" />
        </div>
      </UCard>
    </div>
    <h2>Your ranking keywords</h2>
    <UCard>
      <TableKeywordsNext :site="site" :page-size="12" />
    </UCard>
  </div>
</template>

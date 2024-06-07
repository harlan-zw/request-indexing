<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'
import CardTopCountries from '~/components/Card/CardTopCountries.vue'

const props = defineProps<{ site: any }>()

// const { user } = useUserSession()

definePageMeta({
  title: 'Overview',
  icon: 'i-heroicons-home',
})

function indexingPercentColor(perc: number) {
  if (perc >= 100)
    return 'text-gray-500'
  if (perc >= 90)
    return 'text-green-500'
  if (perc >= 50)
    return 'text-yellow-500'
  return 'text-red-500'
}

const siteData = useSiteData(props.site)
const { data: devices } = siteData.devices()
const { data: countries } = siteData.countries()
const { data: _dates } = siteData.dateAnalytics()
const dates = computed(() => {
  if (!_dates.value)
    return null
  const period = _dates.value.period
  const prevPeriod = _dates.value.prevPeriod
  return {
    dates: _dates.value.dates,
    period: {
      ...period,
      indexedPercent: Math.round(period.indexedPagesCount / (period.totalPagesCount || 1) * 100),
    },
    prevPeriod: {
      ...prevPeriod,
      indexedPercent: Math.round(prevPeriod.indexedPagesCount / (prevPeriod.totalPagesCount || 1) * 100),
    },
  }
})
</script>

<template>
  <div class="space-y-7">
    <div class="grid grid-cols-3 gap-7">
      <div>
        <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
          <UButton variant="ghost" color="gray" :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/web-indexing`" class="w-full">
            <div class="w-full">
              <ProgressPercent :value="dates?.period.indexedPercent">
                <div class="text-xs text-gray-600">
                  Pages Indexed
                </div>
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center justify-center gap-1">
                    <span class="text-4xl font-semibold" :class="indexingPercentColor(dates?.period.indexedPercent)">
                      {{ useHumanFriendlyNumber(dates?.period.indexedPercent) }}%
                    </span>
                    <UIcon v-if="dates?.period.indexedPercent >= 50 && dates?.period.indexedPercent < 100" name="i-ph-info-duotone" class="w-4 h-4 text-yellow-500" />
                    <UIcon v-else-if="dates?.period.indexedPercent < 50" name="i-ph-warning-duotone" class="w-4 h-4 text-red-500" />
                  </div>
                  <div class="text-xs mt-2 text-gray-500">
                    <div>
                      <div class="flex gap-3 justify-between mb-1">
                        <div class="text-gray-500 dark:text-gray-200">
                          Indexed Pages
                        </div>
                        <div>{{ dates?.period.indexedPagesCount }}</div>
                      </div>
                      <div class="flex gap-3 justify-between mb-1">
                        <div class="text-gray-500 dark:text-gray-200">
                          Total Pages
                        </div>
                        <div>{{ dates?.period.totalPagesCount }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </ProgressPercent>
            </div>
          </UButton>
        </UCard>
      </div>
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <CardGoogleSearchConsole :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['clicks', 'impressions']" />
      </UCard>
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <CardKeywords v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['keywords']" />
      </UCard>
    </div>
    <div class="grid grid-cols-12 gap-7">
      <div class="col-span-8 space-y-5">
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm">
              Top Pages
            </div>
            <NuxtLink :to="`/dashboard/site/${site.siteId}/pages`" class="underline text-sm font-normal ml-3">
              View All
            </NuxtLink>
          </div>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <TablePagesNext :exclude-columns="['psiScore', 'actions']" :sortable="false" :pagination="false" :searchable="false" :expandable="false" :site="site" :filters="[]" :page-size="5" />
          </UCard>
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="text-sm">
              Top Keywords
            </div>
            <NuxtLink :to="`/dashboard/site/${site.siteId}/pages`" class="underline text-sm font-normal ml-3">
              View All
            </NuxtLink>
          </div>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <TableKeywordsNext :exclude-columns="['actions', 'position', 'actions', 'positionPercent', 'competitionIndex']" :sortable="false" :pagination="false" :searchable="false" :expandable="false" :site="site" :filters="[]" :page-size="5" />
          </UCard>
        </div>
      </div>
      <div class="col-span-4 space-y-5">
        <CardTopCountries v-if="countries" :countries="countries" />
        <CardDevices v-if="devices" :devices="devices" />
      </div>
    </div>
  </div>
</template>

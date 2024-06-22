<script lang="ts" setup>
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import { useSiteData } from '~/composables/fetch'
import TableCountries from '~/components/Table/TableCountries.vue'

const props = defineProps<{ site: any }>()

// const { user } = useUserSession()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Web Indexing',
  icon: 'i-ph-check-circle-duotone',
})

const siteData = useSiteData(props.site)
const { data: _dates } = siteData.dateAnalytics()
const dates = computed(() => {
  if (!_dates.value)
    return null
  const period = _dates.value.period
  const prevPeriod = _dates.value.prevPeriod
  return {
    ..._dates.value,
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

const { data } = siteData.indexing()
</script>

<template>
<div class="space-y-7">
  <div class="grid grid-cols-12 gap-7">
    <div class="col-span-9 space-y-10">
      <div>
        <CardTitle>Non-indexed pages</CardTitle>
        <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
          <div class="grid grid-cols-2 gap-7  items-center justify-center">
            <CardWebIndexing v-if="dates" :key="site.siteId" :dates="dates?.dates" :period="dates?.period" :prev-period="dates?.prevPeriod" :site="site" :selected-charts="['keywords']" />
          </div>
          <TableIndexing v-if="data" :value="data" :site="site" />
        </UCard>
      </div>
    </div>
    <div class="col-span-3 space-y-10">
      <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
        <h2 class="mb-2 flex items-center text-sm font-semibold">
          <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
          How it works
        </h2>
        <div class="text-sm text-gray-500 mb-1">
          Every day your top pages will be scanned with the PageSpeed Insights API and the results will appear here.
        </div>
        <div class="text-sm text-gray-500">
          Free users get their top 5 pages scanned on both mobile and desktop.
        </div>
      </UCard>
      <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
        <h2 class="mb-2 flex items-center text-sm font-semibold gap-1">
          <UIcon name="i-ph-lock-duotone" class="w-5 h-5 text-gray-500" />
          <span>Permissions</span>
        </h2>
        <div class="text-sm mb-4">
          <div>
            Authorization is required for the <NuxtLink to="/" class="underline">
            Web Indexing API
          </NuxtLink>.
            This is used to submit URLs to be indexed. You can safely revoke it at any
            time on the <NuxtLink class="underline">
            account page
          </NuxtLink>.
          </div>
        </div>
        <UButton external to="/h3/google-indexing" color="gray" icon="i-heroicons-lock-closed">
          Authorize Web Indexing API
        </UButton>
      </UCard>
      <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }" class="relative">
        <h2 class="mb-2 flex items-center text-sm font-semibold gap-1">
          <UIcon name="i-ph-desktop-duotone" class="w-5 h-5 text-gray-500" />
          <span>Quota</span>
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          You are limited to the number of indexing requests you can make each day.
        </p>
        <div>
          <div class="text-gray-600 dark:text-gray-300">
            <div>
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-sm">
                    Request Indexing
                  </div>
                  <div class="text-lg font-bold">
                    15/20
                  </div>
                  <UProgress :value="15" color="purple" class="mt-1" />
                </div>
                <!--              <UButton to="/account/upgrade" color="purple" size="xs" :variant="user.quota.indexingApi < apiCallLimit ? 'soft' : 'solid'"> -->
                <!--                Upgrade -->
                <!--              </UButton> -->
              </div>
              <!--            <div class="mt-5 text-gray-600 text-sm"> -->
              <!--              <p class="mb-2"> -->
              <!--                You've used up all of your API calls for the day. They will reset at midnight PTD. -->
              <!--              </p> -->
              <!--              <p class="mb-2"> -->
              <!--                Don't feel like waiting? You can upgrade to Pro and get the following: -->
              <!--              </p> -->
              <!--              <ul class="list-disc ml-5"> -->
              <!--                <li class="mb-2"> -->
              <!--                  200 API calls / per day -->
              <!--                </li> -->
              <!--                <li> -->
              <!--                  <UBadge color="blue" variant="soft"> -->
              <!--                    Soon -->
              <!--                  </UBadge> Automatic index requests for new pages -->
              <!--                </li> -->
              <!--              </ul> -->
              <!--            </div> -->
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</div>
</template>

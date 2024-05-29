<script lang="ts" setup>
import { useSiteData } from '~/composables/fetch'
import type { SiteSelect } from '~/server/database/schema'

const props = defineProps<{ site: SiteSelect }>()

definePageMeta({
  title: 'Web Indexing',
  icon: 'i-heroicons-check-circle',
})

const { user } = useUserSession()

const siteData = useSiteData(props.site)
const { data } = siteData.indexing()
// const { data: dateAnalytics } = siteData.dateAnalytics()

// const graph = computed(
//   () => (dateAnalytics.value?.dates || []).map(((row) => {
//     return {
//       indexedPagesCount: row.indexedPagesCount,
//       indexedPercent: Math.round(row.indexedPagesCount / (row.totalPagesCount || 1) * 100),
//       totalPagesCount: row.totalPagesCount,
//     }
//   })),
// )

// const lastEntry = computed(() => {
//   if (!graph?.value?.length) {
//     return {
//       totalPagesCount: 0,
//       indexedPagesCount: 0,
//       indexedPercent: 0,
//     }
//   }
//   return graph.value[graph.value.length - 1]
// })

// const buttons = computed(() => [
//   {
//     key: 'totalPagesCount',
//     icon: 'i-ph-list-magnifying-glass',
//     label: 'Total Pages',
//     value: lastEntry.value?.totalPagesCount,
//     color: 'purple',
//   },
//   {
//     key: 'indexedPagesCount',
//     icon: 'i-ph-list-check',
//     label: 'Indexed Pages',
//     value: lastEntry.value?.indexedPagesCount,
//     color: 'blue',
//   },
//   {
//     key: 'indexedPercent',
//     icon: 'i-carbon-bot',
//     label: 'Indexed %',
//     value: lastEntry.value?.indexedPercent,
//     color: 'orange',
//   },
// ])
//
// const columns = [
//   'totalPagesCount',
//   'indexedPagesCount',
//   {
//     key: 'indexedPercent',
//     type: 'line',
//     priceScaleId: 'left',
//     priceFormat: {
//       type: 'percent',
//     },
//   },
// ]
</script>

<template>
<div>
  <div class="grid grid-cols-3 w-full gap-10 mb-10">
    <UCard>
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
    <UCard>
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
    <UCard>
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
                <UProgress :value="15" :color="'purple'" class="mt-1" />
              </div>
<!--              <UButton to="/account/upgrade" color="purple" size="xs" :variant="user.quota.indexingApi < apiCallLimit ? 'soft' : 'solid'">-->
<!--                Upgrade-->
<!--              </UButton>-->
            </div>
<!--            <div class="mt-5 text-gray-600 text-sm">-->
<!--              <p class="mb-2">-->
<!--                You've used up all of your API calls for the day. They will reset at midnight PTD.-->
<!--              </p>-->
<!--              <p class="mb-2">-->
<!--                Don't feel like waiting? You can upgrade to Pro and get the following:-->
<!--              </p>-->
<!--              <ul class="list-disc ml-5">-->
<!--                <li class="mb-2">-->
<!--                  200 API calls / per day-->
<!--                </li>-->
<!--                <li>-->
<!--                  <UBadge color="blue" variant="soft">-->
<!--                    Soon-->
<!--                  </UBadge> Automatic index requests for new pages-->
<!--                </li>-->
<!--              </ul>-->
<!--            </div>-->
          </div>
        </div>
      </div>
    </UCard>
    <UCard>
      <h2 class="mb-2 flex items-center text-sm font-semibold gap-1">
        <UIcon name="i-ph-device-mobile-duotone" class="w-5 h-5 mr-1 text-gray-500" />
        <span>Overview</span>
      </h2>
      <!--        <div class="flex flex-col"> -->
      <!--          <GraphButtonGroup :buttons="buttons" :model-value="['pages']"> -->
      <!--            <template #indexedPagesCount-trend> -->
      <!--            <TrendPercentage :value="lastEntry?.indexedPagesCount" :prev-value="dateAnalytics.prevPeriod?.indexedPagesCount" /> -->
      <!--            </template> -->
      <!--          </GraphButtonGroup> -->
      <!--        </div> -->
      <!--        <GraphData v-if="dateAnalytics?.dates?.length" :labels="true" :height="300" :columns="columns" :value="dateAnalytics.dates" /> -->
    </UCard>
  </div>
  <UCard>
    <TableIndexing v-if="data" :value="data" :site="site" />
    <!--      <div> -->
    <!--        <div v-if="data?.requiresActionPercent === -1" class="text-lg text-gray-600 dark:text-gray-300 mb-2"> -->
    <!--          <UAlert color="yellow" variant="outline" icon="i-heroicons-exclamation-circle" title="Too many URLs"> -->
    <!--            <template #description> -->
    <!--            <div> -->
    <!--              We are unable to calculate the percentage of non-indexed pages due to the large number of -->
    <!--              URLs. You can still inspect URLs to see if they are indexed. -->
    <!--            </div> -->
    <!--            </template> -->
    <!--          </UAlert> -->
    <!--          <div>Upgrade to Pro to start indexing large sites.</div> -->
    <!--          <UButton /> -->
    <!--          <TableNonIndexedUrls :value="data?.requiresAction" :site="site" /> -->
    <!--        </div> -->
    <!--        <div v-else-if="!pending && data?.needsCrawl"> -->
    <!--          <div>Missing sitemap, you will need our bots to crawl your site.</div> -->
    <!--          <UButton @click="crawl = true"> -->
    <!--            Crawl -->
    <!--          </UButton> -->
    <!--        </div> -->
    <!--        <div v-else-if="!pending && !data?.requiresAction.length"> -->
    <!--          <div class="text-lg text-gray-600 dark:text-gray-300 mb-2"> -->
    <!--            All of your pages are indexed. Congrats! -->
    <!--          </div> -->
    <!--        </div> -->
    <!--        <UCard v-if="site.permissionLevel !== 'siteOwner'"> -->
    <!--          <template #header> -->
    <!--          <h2 class="text-lg font-bold flex items-center gap-2"> -->
    <!--            <UIcon name="i-heroicons-lock-closed" class="w-5 h-5" /> -->
    <!--            <span>Invalid Permission</span> -->
    <!--          </h2> -->
    <!--          </template> -->
    <!--          <div class="text-sm mb-4"> -->
    <!--            <div class="mb-2"> -->
    <!--              You are not the owner of <NuxtLink target="_blank" :to="`https://search.google.com/search-console/ownership?resource_id=${encodeURIComponent(slug)}`" class="font-mono whitespace-nowrap underline"> -->
    <!--              {{ site.domain }} -->
    <!--            </NuxtLink> property. You will only be able to view data -->
    <!--              and inspect URLs. -->
    <!--            </div> -->
    <!--            <div> -->
    <!--              Please update the permissions in <NuxtLink target="_blank" :to="`https://search.google.com/search-console/ownership?resource_id=${encodeURIComponent(slug)}`" class="whitespace-nowrap underline"> -->
    <!--              Google Search Console -->
    <!--            </NuxtLink> to fix this. -->
    <!--            </div> -->
    <!--          </div> -->
    <!--        </UCard> -->
  </UCard>
</div>
</template>

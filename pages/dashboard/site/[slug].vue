<script lang="ts" setup>
import { useAuthenticatedUser } from '~/composables/auth'
import type { GoogleSearchConsoleSite } from '~/types'

const user = useAuthenticatedUser()

const slug = useRoute().params.slug as string

const { data: sites } = await fetchSites()

const site: GoogleSearchConsoleSite = (sites.value || []).find(site => site.siteUrl === slug)
if (!sites.value || !site) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page Not Found',
  })
}

const { data, pending, refresh } = await fetchSite(site)

const crawl = ref<undefined | true>()

const nonIndexedUrlsCount = computed(() => (data.value?.nonIndexedUrls || []).length)
const period = computed(() => data.value?.period || [])
const analytics = computed(() => (data.value?.analytics || { period: { totalClicks: 0 }, prevPeriod: { totalClicks: 0 } }))

const siteUrlFriendly = useFriendlySiteUrl(slug)

const params = useUrlSearchParams('history', {
  removeNullishValues: true,
  removeFalsyValues: false,
})

const tab = computed({
  get() {
    return 0
  },
  set(value) {
    if (value === 0 && !pending.value && data.value)
      refresh()

    if (value)
      params.tab = String(value)
    else
      params.tab = null
  },
})

useHead({
  title: siteUrlFriendly,
})

const crawlerEnabled = useRuntimeConfig().public.features.crawler

const apiCallLimit = user.value.access === 'pro' ? 200 : useRuntimeConfig().public.indexing.usageLimitPerUser
</script>

<template>
  <UContainer>
    <div class="py-10">
      <div>
        <div class="relative xl:grid grid-cols-3 gap-10">
          <div class="col-span-2">
            <div class="flex items-center justify-between gap-10 mb-5 md:mb-12">
              <div class="flex items-center gap-7">
                <div>
                  <div class="text-lg md:text-3xl flex items-center gap-2 dark:text-gray-300 text-gray-900 ">
                    <img :src="`https://www.google.com/s2/favicons?domain=${siteUrlFriendly}`" alt="favicon" class="w-4 h-4 rounded-sm">
                    {{ siteUrlFriendly }}
                  </div>
                  <div>
                    <div class="opacity-60 text-sm md:text-lg">
                      <template v-if="slug.includes('sc-domain:')">
                        Domain Property
                      </template>
                      <template v-else>
                        Site Property
                      </template>
                    </div>
                  </div>
                </div>
                <div class="lg:block hidden">
                  <MetricGuage v-if="data?.nonIndexedPercent" :score="data.nonIndexedPercent">
                    <div class="text-xl">
                      {{ data.nonIndexedPercent === -1 ? '?' : Math.round(data.nonIndexedPercent * 100) }}
                    </div>
                  </MetricGuage>
                </div>
              </div>
              <div v-if="!pending" class="lg:flex items-center justify-center gap-10 hidden ">
                <div class="flex flex-col justify-center">
                  <span class="text-sm opacity-70">Clicks</span>
                  <div class="text-xl flex items-end gap-2">
                    <span>{{ useHumanFriendlyNumber(analytics.period.totalClicks) }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="w-5 h-5 opacity-80"><path fill="#888888" d="m11.5 11l6.38 5.37l-.88.18l-.64.12c-.63.13-.99.83-.71 1.4l.27.58l1.36 2.94l-1.42.66l-1.36-2.93l-.26-.58a.985.985 0 0 0-1.52-.36l-.51.4l-.71.57zm-.74-2.31a.76.76 0 0 0-.76.76V20.9c0 .42.34.76.76.76c.19 0 .35-.06.48-.16l1.91-1.55l1.66 3.62c.13.27.4.43.69.43c.11 0 .22 0 .33-.08l2.76-1.28c.38-.18.56-.64.36-1.01L17.28 18l2.41-.45a.88.88 0 0 0 .43-.26c.27-.32.23-.79-.12-1.08l-8.74-7.35l-.01.01a.756.756 0 0 0-.49-.18M15 10V8h5v2zm-1.17-5.24l2.83-2.83l1.41 1.41l-2.83 2.83zM10 0h2v5h-2zM3.93 14.66l2.83-2.83l1.41 1.41l-2.83 2.83zm0-11.32l1.41-1.41l2.83 2.83l-1.41 1.41zM7 10H2V8h5z" /></svg>
                  </div>
                  <TrendPercentage :value="analytics.period.totalClicks" :prev-value="analytics.prevPeriod.totalClicks" />
                </div>
                <div class="flex flex-col justify-center">
                  <span class="text-sm opacity-70">Impressions</span>
                  <div class="text-xl flex items-end gap-2">
                    <span>{{ useHumanFriendlyNumber(analytics.period.totalImpressions) }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="0" height="24" viewBox="0 0 32 32" class="w-5 h-5 opacity-80"><path fill="#888888" d="M30.94 15.66A16.69 16.69 0 0 0 16 5A16.69 16.69 0 0 0 1.06 15.66a1 1 0 0 0 0 .68A16.69 16.69 0 0 0 16 27a16.69 16.69 0 0 0 14.94-10.66a1 1 0 0 0 0-.68ZM16 25c-5.3 0-10.9-3.93-12.93-9C5.1 10.93 10.7 7 16 7s10.9 3.93 12.93 9C26.9 21.07 21.3 25 16 25Z" /><path fill="#888888" d="M16 10a6 6 0 1 0 6 6a6 6 0 0 0-6-6Zm0 10a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" /></svg>
                  </div>
                  <TrendPercentage :value="analytics.period.totalImpressions" :prev-value="analytics.prevPeriod.totalImpressions" />
                </div>
              </div>
            </div>
            <UTabs
              v-model="tab"
              class="col-span-2" :items="[
                { label: 'Non-Indexed Pages', count: nonIndexedUrlsCount },
                { label: 'Indexed Pages', count: period.length },
                { label: 'Keywords', count: data?.keywords?.length || 0 },
              ]"
            >
              <template #default="{ item, index, selected }">
                <div class="flex items-center gap-2 relative truncate">
                  <UBadge v-if="item.count" :color="selected ? 'green' : 'gray'" class="hidden md:flex">
                    {{ item.count }}
                  </UBadge>
                  <UIcon v-else-if="index === 0" name="i-heroicons-check-circle" class="w-5 h-5" :class="selected ? 'text-green-400' : 'text-gray-400'" />
                  <span class="truncate">{{ item.label }}</span>
                </div>
              </template>
              <template #item="{ item }">
                <div class="mt-4">
                  <UCard v-if="item.label === 'Non-Indexed Pages'">
                    <div class="text-sm text-gray-500 ">
                      <div v-if="data?.nonIndexedPercent === -1" class="text-lg text-gray-600 dark:text-gray-300 mb-2">
                        <UAlert color="yellow" variant="outline" icon="i-heroicons-exclamation-circle" title="Too many URLs">
                          <template #description>
                            <div>
                              We are unable to calculate the percentage of non-indexed pages due to the large number of
                              URLs. You can still inspect URLs to see if they are indexed.
                            </div>
                          </template>
                        </UAlert>
                        <div>Upgrade to Pro to start indexing large sites.</div>
                        <UButton />
                        <TableNonIndexedUrls :value="data?.period" :site="site" />
                      </div>
                      <div v-else-if="!pending && data?.needsCrawl">
                        <div>Missing sitemap, you will need our bots to crawl your site.</div>
                        <UButton @click="crawl = true">
                          Crawl
                        </UButton>
                      </div>
                      <div v-else-if="!pending && !nonIndexedUrlsCount">
                        <div class="text-lg text-gray-600 dark:text-gray-300 mb-2">
                          All of your pages are indexed. Congrats!
                        </div>
                      </div>
                      <div v-else>
                        <TableNonIndexedUrls v-if="data?.nonIndexedPercent !== -1" :value="data?.nonIndexedUrls" :site="site" />
                      </div>
                    </div>
                  </UCard>
                  <UCard v-else-if="item.label === 'Indexed Pages'">
                    <TablePages :value="data?.period" :site="site" />
                  </UCard>
                  <UCard v-else>
                    <TableKeywords :value="data?.keywords" :site="site" />
                  </UCard>
                </div>
              </template>
            </UTabs>
          </div>
          <div class="gap-7 relative">
            <div class="h-[115px] w-full mb-5">
              <GraphClicks v-if="!pending && data?.graph" height="115" class="mt-9" :value="data.graph.map(g => ({ time: g.time, value: g.clicks }))" :value2="data.graph.map(g => ({ time: g.time, value: g.impressions }))" />
            </div>
            <div class="sticky flex flex-col gap-7" style="top: 100px;">
              <UCard v-if="site.permissionLevel !== 'siteOwner'">
                <template #header>
                  <h2 class="text-lg font-bold flex items-center gap-2">
                    <UIcon name="i-heroicons-lock-closed" class="w-5 h-5" />
                    <span>Invalid Permission</span>
                  </h2>
                </template>
                <div class="text-sm mb-4">
                  <div class="mb-2">
                    You are not the owner of <NuxtLink target="_blank" :to="`https://search.google.com/search-console/ownership?resource_id=${encodeURIComponent(slug)}`" class="font-mono whitespace-nowrap underline">
                      {{ slug }}
                    </NuxtLink> property. You will only be able to view data
                    and inspect URLs.
                  </div>
                  <div>
                    Please update the permissions in <NuxtLink target="_blank" :to="`https://search.google.com/search-console/ownership?resource_id=${encodeURIComponent(slug)}`" class="whitespace-nowrap underline">
                      Google Search Console
                    </NuxtLink> to fix this.
                  </div>
                </div>
              </UCard>
              <UCard v-else-if="user.indexingOAuthIdNext">
                <template #header>
                  <h2 class="text-xl font-bold">
                    Quota
                  </h2>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    You are limited to the number of indexing requests you can make each day.
                  </p>
                </template>
                <div class="text-gray-600 dark:text-gray-300">
                  <div>
                    <div class="flex items-center justify-between">
                      <div>
                        <div class="text-sm">
                          Request Indexing
                        </div>
                        <div class="text-lg font-bold">
                          {{ user.quota.indexingApi }}/{{ apiCallLimit }}
                        </div>
                        <UProgress :value="user.quota.indexingApi / apiCallLimit * 100" :color="user.quota.indexingApi < apiCallLimit ? 'purple' : 'red'" class="mt-1" />
                      </div>
                      <UButton v-if="user.access !== 'pro'" to="/account/upgrade" color="purple" size="xs" :variant="user.quota.indexingApi < apiCallLimit ? 'soft' : 'solid'">
                        Upgrade
                      </UButton>
                    </div>
                    <div v-if="user.quota.indexingApi >= apiCallLimit" class="mt-5 text-gray-600 text-sm">
                      <p class="mb-2">
                        You've used up all of your API calls for the day. They will reset at midnight PTD.
                      </p>
                      <template v-if="user.access !== 'pro'">
                        <p class="mb-2">
                          Don't feel like waiting? You can upgrade to Pro and get the following:
                        </p>
                        <ul class="list-disc ml-5">
                          <li class="mb-2">
                            200 API calls / per day
                          </li>
                          <li>
                            <UBadge color="blue" variant="soft">
                              Soon
                            </UBadge> Automatic index requests for new pages
                          </li>
                        </ul>
                      </template>
                    </div>
                  </div>
                </div>
              </UCard>
              <UCard v-else>
                <template #header>
                  <h2 class="text-lg font-bold">
                    Permissions
                  </h2>
                </template>
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
                <UButton external to="/auth/google-indexing" color="gray" icon="i-heroicons-lock-closed">
                  Authorize Web Indexing API
                </UButton>
              </UCard>
              <UCard v-if="crawlerEnabled">
                <template #header>
                  <h3 class="font-semibold text-lg text-gray-700 dark:text-gray-200 mb-1">
                    Crawler
                  </h3>
                  <p class="text-sm text-gray-500">
                    Discover pages that may be missing from your sitemap or last crawl. Show meta data with the URLs.
                  </p>
                </template>
                <div>
                  <div v-if="!pending && data?.lastCrawl" class="mb-2">
                    Last crawl was {{ useDayjs()(data?.lastCrawl).fromNow() }}.
                  </div>
                  <UBadge color="sky" variant="subtle">
                    Coming Soon
                  </UBadge>
                  <UButton color="gray" icon="i-heroicons-sparkles" disabled @click="crawl = true">
                    <UIcon v-if="pending && crawl" name="i-heroicons-arrow-path" class="animate-spin w-5 h-5" />
                    Crawl
                  </UButton>
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

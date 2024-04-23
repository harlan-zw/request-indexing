<script lang="ts" setup>
import type { GoogleSearchConsoleSite } from '~/types'

definePageMeta({
  title: 'Overview',
  icon: 'i-heroicons-home',
  layout: 'dashboard',
})

const slug = useRoute().params.slug as string

const { data: sitesData } = await fetchSites()

const sites = computed(() => sitesData.value?.sites || [])

const site: GoogleSearchConsoleSite = (sites.value || []).find(site => site.siteId === slug)

if (!sites.value || !site) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Site Not Found',
  })
}
const route = useRoute()

// const siteLoader = await fetchSite(site)
// const { data, pending, refresh } = siteLoader

useHead({
  titleTemplate: '%s %separator %domain %separator %site.name',
  templateParams: {
    domain: useFriendlySiteUrl(site.domain),
  },
})

// const crawl = ref<undefined | true>()

// const analytics = computed(() => (data.value?.analytics || { period: { totalClicks: 0 }, prevPeriod: { totalClicks: 0 } }))

const siteUrlFriendly = useFriendlySiteUrl(site.domain)

// const tab = computed({
//   get() {
//     return Number(params.tab) || 0
//   },
//   set(value) {
//     if (value === 0 && !pending.value && data.value)
//       refresh()
//
//     if (value)
//       params.tab = String(value)
//     else
//       params.tab = null
//   },
// })
//
// useHead({
//   title: siteUrlFriendly,
// })

// const crawlerEnabled = useRuntimeConfig().public.features.crawler
//
// const apiCallLimit = useRuntimeConfig().public.indexing.usageLimitPerUser

const domains = computed(() => {
  // show other sites sharing the same site.siteUrl
  const _domains = sites.value.filter(s => s.property === site.property).map(s => s.domain)
  return [
    ..._domains.map((d) => {
      return {
        label: d.replace('https://', ''),
        value: d,
        to: `/dashboard/site/${encodeURIComponent(d)}`,
      }
    }),
  ]
})

function changeSite(siteUrl) {
  const childSegment = route.path.split('/').pop()
  return navigateTo(`/dashboard/site/${encodeURIComponent(siteUrl)}/${childSegment}`)
}

const domain = ref(site.domain)
watch(domain, () => {
  navigateTo(domain.value.to)
})
</script>

<template>
  <DashboardPageTitle
    v-if="$route.meta"
    :icon="$route.meta.icon"
    :title="$route.meta.title"
    :description="$route.meta.description"
  />
  <!--    <template #left> -->
  <!--      <div class="px-10 bg-gray-50/50 h-full"> -->
  <!--        <UAside> -->
  <!--          <div class="mb-7"> -->
  <!--            <USelectMenu :model-value="slug" variant="none" :options="sites" value-attribute="domain" @change="changeSite"> -->
  <!--              <template #option="{ option }"> -->
  <!--                <div class="flex w-full items-center"> -->
  <!--                  <div class="flex items-center gap-2"> -->
  <!--                    <img :src="`https://www.google.com/s2/favicons?domain=https://${useFriendlySiteUrl(option.domain)}`" alt="favicon" class="w-4 h-4 rounded-sm"> -->
  <!--                    <span class="truncate">{{ useFriendlySiteUrl(option.domain) }}</span> -->
  <!--                  </div> -->
  <!--                </div> -->
  <!--              </template> -->
  <!--              <template #default="{ open }"> -->
  <!--                <UButton color="white" variant="ghost" size="xl" class="flex items-center gap-2" :ui="{ padding: { xl: 'pl-0 -ml-7' } }"> -->
  <!--                  <UIcon name="i-heroicons-chevron-right-20-solid" class="w-5 h-5 transition-transform text-gray-400 dark:text-gray-500" :class="[open && 'transform rotate-90']" /> -->
  <!--                  <img :src="`https://www.google.com/s2/favicons?domain=https://${siteUrlFriendly}`" alt="favicon" class="w-4 h-4 rounded-sm"> -->
  <!--                  {{ siteUrlFriendly }} -->
  <!--                </UButton> -->
  <!--              </template> -->
  <!--            </USelectMenu> -->
  <!--            <div class="flex items-center gap-3"> -->
  <!--              <div class="text-sm"> -->
  <!--                <template v-if="site.property.includes('sc-domain:')"> -->
  <!--                  <div class="w-[200px] "> -->
  <!--                    <USelectMenu v-if="domains.length >= 2" v-model="domain" size="xs" :options="domains" variant="none"> -->
  <!--                      <template #label> -->
  <!--                        <span class="text-gray-700 dark:text-gray-300">{{ domains.length }} Sites In Property</span> -->
  <!--                      </template> -->
  <!--                      <template #option="{ option }"> -->
  <!--                        <img v-if="option.value" :src="`https://www.google.com/s2/favicons?domain=${option.value}`" alt="favicon" class="w-4 h-4 rounded-sm"> -->
  <!--                        <span class="truncate">{{ option.label }}</span> -->
  <!--                      </template> -->
  <!--                    </USelectMenu> -->
  <!--                  </div> -->
  <!--                </template> -->
  <!--                <template v-else> -->
  <!--                  Site Property -->
  <!--                </template> -->
  <!--                <div class="text-xs text-gray-400"> -->
  <!--                  <template v-if="useTimeAgo(data?.dates?.startDate, true) === 'a year ago'"> -->
  <!--                    Created over 16 months ago -->
  <!--                  </template> -->
  <!--                  <template v-else> -->
  <!--                    Created {{ useTimeAgo(data?.dates?.startDate, true) }} -->
  <!--                  </template> -->
  <!--                </div> -->
  <!--              </div> -->
  <!--            </div> -->
  <!--          </div> -->
  <!--        </UAside> -->
  <!--      </div> -->
  <!--    </template> -->
  <NuxtPage
    :site="site"
  />
</template>

<script lang="ts" setup>
definePageMeta({
  title: 'Overview',
  icon: 'i-heroicons-home',
  layout: 'dashboard',
})

const slug = useRoute().params.slug as string

const { data: sitesData } = await fetchSites()

const sites = computed(() => sitesData.value?.sites || [])

const site = (sites.value || []).find(site => site.siteId === slug)

// if (!sites.value || !site) {
//   throw createError({
//     statusCode: 404,
//     statusMessage: 'Site Not Found',
//   })
// }
// const route = useRoute()

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

// const siteUrlFriendly = useFriendlySiteUrl(site.domain)

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

// const domains = computed(() => {
//   // show other sites sharing the same site.siteUrl
//   const _domains = sites.value.filter(s => s.property === site.property).map(s => s.domain)
//   return [
//     ..._domains.map((d) => {
//       return {
//         label: d.replace('https://', ''),
//         value: d,
//         to: `/dashboard/site/${encodeURIComponent(d)}`,
//       }
//     }),
//   ]
// })

// function changeSite(siteUrl) {
//   const childSegment = route.path.split('/').pop()
//   return navigateTo(`/dashboard/site/${encodeURIComponent(siteUrl)}/${childSegment}`)
// }

const domain = ref(site.domain)
watch(domain, () => {
  navigateTo(domain.value.to)
})
</script>

<template>
  <div class="max-w-[1200px]">
    <NuxtPage
      :site="site"
    />
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  title: 'Overview',
  icon: 'i-heroicons-home',
  layout: 'dashboard',
})

const slug = useRoute().params.slug as string

const { data: sitesData } = await fetchSites()

const sites = computed(() => sitesData.value?.sites || [])

// Computed, not a snapshot: this used to read `sites.value.find(...)` once
// during setup. On a server render the roster is not resolved at that moment,
// so `site` was `undefined` forever, `site.domain` below threw, and every
// hard load of this route 500'd while client-side navigation worked.
// `/api/sites/list` returns `sites.public_id` ("kv1112") as `siteId`, while the
// row type declares the integer primary key. Compare as strings until that type
// is honest, so the match does not depend on the lie.
const site = computed(() => sites.value.find(s => String(s.siteId) === slug))

// Only a loaded roster can prove a slug is wrong. Throwing while `sitesData`
// is still null would turn "not fetched yet" into "does not exist".
watchEffect(() => {
  if (sitesData.value && !site.value) {
    throw createError({ statusCode: 404, statusMessage: 'Site Not Found' })
  }
})

useHead({
  titleTemplate: '%s %separator %domain %separator %site.name',
  templateParams: {
    domain: computed(() => site.value ? siteLabel(site.value) : ''),
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
</script>

<template>
  <div class="max-w-[1200px]">
    <!-- Child pages declare `site` as required and dereference it immediately,
         so they must never be mounted with an unresolved roster. -->
    <NuxtPage
      v-if="site"
      :site="site"
    />
  </div>
</template>

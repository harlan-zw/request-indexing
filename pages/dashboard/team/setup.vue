<script lang="ts" setup>
import { withoutTrailingSlash } from 'ufo'
import { useFriendlySiteUrl } from '~/composables/formatting'
import type { SiteSelect } from '~/server/database/schema'

// const { data, pending, refresh, forceRefresh } = fetchSites('all')
const data = ref([])
const pending = ref(true)
async function refresh() {
  // TODO avoid duplicate fetches
  data.value = await $fetch('/api/sites/preview', {
    // query: {
    //   force: 'true',
    // },
  })
    .finally(() => {
      pending.value = false
    })
}

const { user, fetch } = useUserSession()

const isPending = computed(() => pending.value || data.value?.isPending)

const backups = ref(true)
const selectedSites = ref<string[]>([])
const maxSites = 6

const toast = useToast()

const siteRows = computed<SiteSelect[]>(() => {
  if (!data.value)
    return []
  return (data.value.distinctOrigins || []).map((site) => {
    const property = data.value.sites.find(s => s.siteId === site.siteId)
    const analytics = data.value.analytics.find(s => s.siteId === site.siteId)
    const sitemapWarningsCount = site.sitemaps?.reduce((acc, curr) => acc + (Number.parseInt(curr.warnings) || 0), 0)
    const sitemapErrorsCount = site.sitemaps?.reduce((acc, curr) => acc + (Number.parseInt(curr.errors) || 0), 0)

    return {
      ...property,
      ...site,
      ...analytics,
      domain: property.domain || withoutTrailingSlash(property.property),
      sitemapWarningsCount,
      sitemapErrorsCount,
    }
  })
    .sort((a, b) => b.pageCount30Day - a.pageCount30Day)
})

const submitError = ref('')
const isSubmitting = ref(false)

async function onSubmit() {
  // Do something with data
  if (selectedSites.value.length === 0) {
    toast.add({ title: 'You must select at least one site.', color: 'red' })
    submitError.value = 'You must select at least one site.'
    return
  }
  isSubmitting.value = true
  submitError.value = ''
  await $fetch('/api/teams/currentTeam', {
    method: 'POST',
    body: JSON.stringify({
      onboardedStep: 'sites-and-backup', // maybe we change onboarding in future and they need to repeat it
      selectedSites: selectedSites.value,
      backupsEnabled: backups.value,
    }),
  }).then(async () => {
    await fetch()
    // session.value = res
    toast.add({ title: 'You\'re all ready to go!', color: 'green' })
    navigateTo('/dashboard')
  }).catch((err) => {
    isSubmitting.value = false
    toast.add({ title: 'Failed to save your sites', description: err.message, color: 'red' })
  })
}

// function sync() {
//   forceRefresh()
// }

let ws: WebSocket | undefined

async function connect() {
  const isSecure = location.protocol === 'https:'
  const url = `${(isSecure ? 'wss://' : 'ws://') + location.host}/_ws?userId=${user.value!.userId}`
  ws && ws.close()

  ws = new WebSocket(url)

  ws.addEventListener('message', ({ data }) => {
    // TODO handle payload event
    // const payload = JSON.parse(data)
    // const event = payload.event
    refresh()
    // if (event === 'ingest/sites') {
    // }
    // console.log('[ws]', payload)
  })

  await new Promise(resolve => ws!.addEventListener('open', resolve))
}

onMounted(() => {
  refresh()
  connect()
})
</script>

<template>
  <div class="dark:bg-gray-950 min-h-screen">
    <Gradient class="min-h-full" />
    <UContainer class="py-14">
      <UForm class="flex gap-10 items-start" @submit="onSubmit">
        <UCard class="z-2 relative max-w-3xl mx-auto">
          <template #header>
            <h1 class="text-3xl font-semibold">
              Welcome!
            </h1>
          </template>
          <div class="mb-10 mx-3">
            <div v-if="isPending && !isSubmitting">
              <div class="text-center">
                <UIcon name="i-heroicons-arrow-path" class="animate-spin w-12 h-12" />
                <div class="text-xl mb-5">
                  Fetching your data from Google Search Console.
                </div>
                <div class="text-gray-600 dark:text-gray-400">
                  This can take a few minutes depending on how many sites you have. Hold Tight...
                </div>
              </div>
            </div>
            <div v-else-if="!isPending && siteRows.length === 0">
              <div class="text-center">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12" />
                <div class="text-xl mb-5">
                  You don't have any sites connected to <a href="https://search.google.com/search-console" target="_blank" class="underline">Google Search Console</a>. Please add one and re-run the sync.
                </div>
                <UButton @click="sync">
                  Sync
                </UButton>
              </div>
            </div>
            <div v-else>
              <div class="mb-5">
                <h2 class="text-2xl mb-2 font-bold items-center flex gap-3">
                  <UIcon name="i-heroicons-link" class="w-5 h-5 hidden md:block" />
                  Setup your sites
                </h2>
                <p class="dark:text-gray-400 text-gray-500 text-sm">
                  These sites will be displayed on your dashboard and will have their data backed up, if selected.
                </p>
              </div>
              <ul class="mb-9 space-y-4">
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="w-5 h-5" /> Sites are shown with domain property splitting.
                </li>
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="w-5 h-5" /> Connect up to {{ maxSites }} sites on the free plan, update them at any time.
                </li>
              </ul>
              <TeamSiteSelector v-model="selectedSites" />
              <div v-if="!isPending && selectedSites.filter(s => s.isLosingData).length" class="mt-12">
                <UDivider class="my-12" />
                <div class="mb-7">
                  <h2 class="text-xl mb-2 font-bold flex items-center gap-3">
                    <UIcon name="i-carbon-data-backup" class="w-6 h-6 hidden md:block" />
                    Configure Google Search Console Backups
                  </h2>
                  <p class="text-gray-500 dark:text-gray-400 text-sm">
                    Google Search Console only stores your data for 16 months, you can backup your data so you never lose it.
                  </p>
                </div>
                <ul class="mb-7 space-y-5">
                  <li class="flex items-center gap-1">
                    <UIcon name="i-heroicons-check" class="w-5 h-5" /> Backup your data before it gets deleted after 16 months, view and download it at any time.
                  </li>
                  <li class="flex items-center gap-1">
                    <UIcon name="i-heroicons-check" class="w-5 h-5" /> See larger trends in your search performance on the dashboard.
                  </li>
                </ul>
                <label class="flex items-center dark:text-gray-300 text-gray-600 font-bold gap-3 mb-7">
                  <UToggle v-model="backups" color="blue" size="2xl" />
                  <div>Enable Backups</div>
                </label>
                <div>
                  <p class="mb-3">
                    Google Search Console is <strong>currently deleting</strong> data for the below domains because they were created 16 months ago.
                  </p>
                  <ul class="list-disc md:ml-7 text-center space-y-3 flex flex-col mb-7">
                    <li v-for="(s, key) in selectedSites.filter(s => s.isLosingData)" :key="key" class="flex items-center gap-2 text-lg">
                      <UIcon v-if="!backups" name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-yellow-500" />
                      <img :src="`https://www.google.com/s2/favicons?domain=${s.domain || s.property.replace('sc-domain:', 'https://')}`" alt="favicon" class="w-4 h-4">
                      <h3 class="font-bold">
                        {{ useFriendlySiteUrl(s.domain || s.property) }}
                      </h3>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <template #footer>
            <div class="flex flex-col md:flex-row items-center gap-3">
              <UButton :loading="isSubmitting" type="submit" size="xl" :disabled="isPending || !selectedSites.length">
                Continue to Dashboard
              </UButton>
              <div v-if="!isPending" class="text-gray-600 dark:text-gray-300 text-sm">
                <template v-if="selectedSites.length">
                  You have selected {{ selectedSites.length }} sites with backups {{ backups ? 'enabled' : 'disabled' }}.
                </template>
                <template v-else>
                  Please select at least one site.
                </template>
              </div>
            </div>
          </template>
        </UCard>
        <UCard class="z-3 relative max-w-sm">
          <template #header>
            <h1 class="text-xl font-semibold">
              FAQ
            </h1>
          </template>
          <div>
            <div class="mb-5">
              <h3 class="text-base mb-2 font-semibold">
                What do you do with my data?
              </h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                We use your data to generate reports and insights to help you understand your search performance.
              </p>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                We do not share your data with anyone.
              </p>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                You can delete your data at any time.
              </p>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                See our
                <NuxtLink class="underline" to="/privacy" target="_blank">
                  privacy policy
                </NuxtLink> for more details.
              </p>
            </div>
            <div class="mb-5">
              <h3 class="text-base mb-2 font-semibold">
                What is domain property splitting?
              </h3>
              <p class="dark:text-gray-400 text-gray-600 text-sm mb-2">
                Google Search Console allows you submit either a domain or a URL property. Domain properties are recommended for most sites
                but they become difficult to track analytics when you have multiple subdomains.
              </p>
              <p class="dark:text-gray-400 text-gray-600 text-sm mb-5">
                For example, if you have <code>example.com</code> and <code>blog.example.com</code> as separate properties, you can track them separately.
              </p>
            </div>
            <div>
              <h3 class="text-base mb-2 font-semibold">
                Why do I need to backup my data?
              </h3>
              <p class="text-gray-500 dark:text-gray-400 text-sm">
                Google Search Console only stores your data for 16 months. By enabling backups, you can store your data for as long as you like and always view it on your dashboard.
              </p>
            </div>
          </div>
        </UCard>
      </UForm>
    </UContainer>
  </div>
</template>

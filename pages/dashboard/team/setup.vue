<script lang="ts" setup>
import type { SitePreview } from '~/types'
import { useJobListener } from '~/composables/events'

// const { data, pending, refresh, forceRefresh } = fetchSites('all')
const data = ref<{ sites: SitePreview[], jobStatus: string }>([])
const key = ref(0)
const pending = ref(true)

const isSetup = ref(false)
const sitesSynced = ref(0)
const totalSites = ref(0)

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
  // if (data.value.filter(s => !!s.lastSynced).length)
  sitesSynced.value = data.value.sites.filter(s => !!s.pageCount30Day).length
  isSetup.value = data.value.jobStatus !== 'pending'
  totalSites.value = data.value.sites.length

  key.value++
}

const { fetch } = useUserSession()

const isPending = computed(() => pending.value)
const backups = ref(true)
const selectedSites = ref<SitePreview[]>([])
const toast = useToast()
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

onMounted(() => refresh())

useJobListener('sites/setup', () => {
  refresh()
  sitesSynced.value++
  key.value++
})

useJobListener('users/syncGscSites', () => {
  refresh()
  isSetup.value = true
  key.value++
})

function setSelectedSites(val) {
  selectedSites.value = val
}

const sites = computed(() => {
  return data.value?.sites || []
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
              Select your sites
            </h1>
          </template>
          <div class="mb-10 mx-3">
            <div v-if="!isSetup">
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
            <div v-else-if="!isPending && sites.length === 0">
              <div class="text-center">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12" />
                <div class="text-xl mb-5">
                  You don't have any sites connected to <a href="https://search.google.com/search-console" target="_blank" class="underline">Google Search Console</a>. Please add one and re-run the sync.
                </div>
                <UButton>
                  Sync (TODO)
                </UButton>
              </div>
            </div>
            <div v-else>
              <p class="dark:text-gray-400 text-gray-600 text-sm mb-3">
                These properties are <NuxtLink to="/" class="underline">
                  domain split
                </NuxtLink> from your Google Search Console account. If you don't see your site, please
                check it exists within <a class="underline" href="https://search.google.com/search-console" target="_blank">Google Search Console</a>.
              </p>
              <p class="dark:text-gray-400 text-gray-600 text-sm mb-5">
                The free plan includes up to 3 sites, up to 10,000 pages and tracking up to 100 keywords and pages with Psi. The Pro
                plan is unlimited and is in development.
              </p>
              <div class="mb-3">
                <div class="text-sm font-bold text-gray-700 mb-1">
                  Please select up to 3 sites to continue.
                </div>
                <div class="text-xs text-gray-500">
                  The free plan offers limited sites, pro users have unlimited.
                </div>
              </div>
              <div v-if="sitesSynced < totalSites">
                <div class="text-sm mb-1 font-semibold text-center">
                  <UIcon name="i-heroicons-arrow-path" class="animate-spin w-5 h-5" />
                  Syncing sites {{ sitesSynced }}/{{ totalSites }}
                </div>
                <UProgress :max="totalSites" :value="sitesSynced" class="mb-5" />
              </div>
              <TeamSiteSelector :key="key" :sites="sites" :model-value="selectedSites" @update:model-value="setSelectedSites" />
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
        <div>
          <UCard class="z-3 relative max-w-sm">
            <template #header>
              <h1 class="text-xl font-semibold">
                FAQ
              </h1>
            </template>
            <div class="space-y-5">
              <div>
                <h3 class="text-base mb-2 font-semibold">
                  What does Request Indexing do?
                </h3>
                <div class="space-y-2">
                  <p class="text-gray-500 dark:text-gray-400 text-sm">
                    1. Splits your property domains into easily trackable sites - <NuxtLink to="/" class="underline">
                      what is domain property splitting
                    </NuxtLink>.
                  </p>
                  <p class="text-gray-500 dark:text-gray-400 text-sm">
                    2. Requests Google to index your missing pages - <NuxtLink to="/" class="underline">
                      why you need to index your pages
                    </NuxtLink>.
                  </p>
                  <p class="text-gray-500 dark:text-gray-400 text-sm">
                    3. Provides detailed GSC pages and keyword insights - <NuxtLink to="/" class="underline">
                      why you need to index your pages
                    </NuxtLink>.
                  </p>
                  <p class="text-gray-500 dark:text-gray-400 text-sm">
                    4. Performs PageSpeed Insight tests on your popular pages - <NuxtLink to="/" class="underline">
                      why you need to index your pages
                    </NuxtLink>.
                  </p>
                  <p class="text-gray-500 dark:text-gray-400 text-sm">
                    5. Store your Google Search Console data for as long as you like - <NuxtLink to="/" class="underline">
                      why you need to backup your data
                    </NuxtLink>.
                  </p>
                </div>
              </div>
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
        </div>
      </UForm>
    </UContainer>
  </div>
</template>

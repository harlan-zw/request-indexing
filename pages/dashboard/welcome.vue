<script lang="ts" setup>
import { fetchSites } from '~/composables/fetch'
import { useFriendlySiteUrl } from '~/composables/formatting'
import type { GoogleSearchConsoleSite } from '~/types'

const { data, pending, refresh, forceRefresh } = await fetchSites('all')

const { session, user } = useUserSession()

const sites = computed(() => data.value?.sites || [])
const isPending = computed(() => pending.value || data.value?.isPending)

const backups = ref(true)
const selected = ref([])
const maxSites = 6

watch(isPending, () => {
  if (!isPending.value) {
    if (user.value.selectedSites)
      selected.value = sites.value.filter(s => user.value.selectedSites.includes(s.domain))
    else
      selected.value = sites.value.slice(0, maxSites)
  }
}, {
  immediate: true,
})

onMounted(() => {
  // keep refreshing once pending is finished until we have data
  watch(pending, () => {
    if (!pending.value && data.value?.isPending)
      useTimeoutFn(refresh, 4000)
  })
})
const toast = useToast()
function select(row) {
  const index = selected.value.findIndex(item => item.domain === row.domain)
  if (index === -1 && selected.value.length < maxSites)
    selected.value.push(row)
  else if (index !== -1)
    selected.value.splice(index, 1)
  else
    toast.add({ title: `You can only select up to ${maxSites} sites.`, color: 'red' })
}

const sitePage = ref(1)
const domainPage = ref(1)
const pageCount = 5

const siteRows = computed<GoogleSearchConsoleSite[]>(() => {
  return sites.value!.filter(s => !s.siteUrl.startsWith('sc-domain:'))
})

const paginatedSiteRows = computed<GoogleSearchConsoleSite[]>(() => {
  return siteRows.value.slice((sitePage.value - 1) * pageCount, (sitePage.value) * pageCount)
})

const domainRows = computed<GoogleSearchConsoleSite[]>(() => {
  return sites.value!.filter(s => s.siteUrl.startsWith('sc-domain:'))
})

const paginatedDomainRows = computed<GoogleSearchConsoleSite[]>(() => {
  return domainRows.value.slice((domainPage.value - 1) * pageCount, (domainPage.value) * pageCount)
})

const submitError = ref('')
const isSubmitting = ref(false)

async function onSubmit() {
  // Do something with data
  if (selected.value.length === 0) {
    toast.add({ title: 'You must select at least one site.', color: 'red' })
    submitError.value = 'You must select at least one site.'
    return
  }
  isSubmitting.value = true
  submitError.value = ''
  await $fetch('/api/user/me', {
    method: 'POST',
    body: JSON.stringify({
      onboardedStep: 'sites-and-backup', // maybe we change onboarding in future and they need to repeat it
      selectedSites: selected.value.map(s => s.domain),
      backupsEnabled: backups.value,
    }),
  }).then((res) => {
    session.value = res
    toast.add({ title: 'You\'re all ready to go!', color: 'green' })
    navigateTo('/dashboard')
  }).catch((err) => {
    isSubmitting.value = false
    toast.add({ title: 'Failed to save your sites', description: err.message, color: 'red' })
  })
}

function sync() {
  forceRefresh()
}
</script>

<template>
  <div class="bg-gray-950 min-h-screen">
    <Gradient />
    <UContainer class="py-14">
      <UForm @submit="onSubmit">
        <UCard class="z-2 relative max-w-3xl mx-auto">
          <template #header>
            <h1 class="text-3xl font-semibold">
              Welcome! Let's get started.
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
            <div v-else-if="!isPending && sites.length === 0">
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
              <div class="mb-7">
                <h2 class="text-xl mb-2 font-bold items-center flex gap-3">
                  <UIcon name="i-heroicons-link" class="w-5 h-5 hidden md:block" />
                  Connect Your Sites
                </h2>
                <p class="dark:text-gray-400 text-gray-500 text-sm">
                  These sites will be displayed on your dashboard and will have their data backed up, if selected.
                </p>
              </div>
              <ul class="mb-7 space-y-3 md:ml-7">
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="w-5 h-5" /> View your domain property analytics as separate sites.
                </li>
                <li class="flex items-center gap-1">
                  <UIcon name="i-heroicons-check" class="w-5 h-5" /> Connect up to {{ maxSites }} sites, update them at any time.
                </li>
              </ul>
              <div>
                <div v-if="siteRows.length" class="mb-7">
                  <div class="mb-3">
                    <h2 class="text-lg mb-1 font-bold">
                      Site Properties
                    </h2>
                  </div>
                  <div class="">
                    <UTable v-model="selected" :rows="paginatedSiteRows" :columns="[{ key: 'siteUrl', label: 'Domain' }]" @select="select">
                      <template #siteUrl-data="{ row: site }">
                        <div class="flex items-center gap-3 md:text-xl" :class="selected.some(s => s.domain === site.domain) ? '' : 'opacity-70'">
                          <img :src="`https://www.google.com/s2/favicons?domain=${site.siteUrl.replace('sc-domain:', 'https://')}`" alt="favicon" class="w-4 h-4">
                          <div>
                            <h3 class="font-bold text-gray-800 dark:text-gray-100">
                              {{ useFriendlySiteUrl(site.siteUrl) }}
                            </h3>
                          </div>
                        </div>
                      </template>
                    </UTable>
                    <div v-if="siteRows.length > pageCount" class="flex items-center justify-between mt-7 px-3 py-5 border-t  border-gray-200 dark:border-gray-700">
                      <UPagination v-model="sitePage" :page-count="pageCount" :total="siteRows.length" />
                      <div class="text-base dark:text-gray-300 text-gray-600 mb-2">
                        {{ siteRows.length }} total
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="domainRows.length">
                  <div class="mb-3">
                    <h2 class="text-lg mb-1 font-bold">
                      Domain Properties
                    </h2>
                  </div>
                  <div class="mb-5">
                    <UTable v-model="selected" :rows="paginatedDomainRows" :columns="[{ key: 'siteUrl', label: 'Domain', sortable: true }, { key: 'pageCount30Day', label: 'Pages', sortable: true }]" @select="select">
                      <template #pages-data="{ row: site }">
                        <div class="text-right">
                          {{ site.pageCount30Day }}
                        </div>
                      </template>
                      <template #siteUrl-data="{ row: site }">
                        <div class="flex items-center gap-3 md:text-xl" :class="selected.some(s => s.domain === site.domain) ? '' : 'opacity-70'">
                          <img :src="`https://www.google.com/s2/favicons?domain=${site.siteUrl.replace('sc-domain:', 'https://')}`" alt="favicon" class="w-4 h-4">
                          <div>
                            <h3 class="font-bold text-gray-800 dark:text-gray-100">
                              {{ useFriendlySiteUrl(site.domain) }}
                            </h3>
                          </div>
                        </div>
                      </template>
                    </UTable>
                    <div v-if="domainRows.length > pageCount" class="flex items-center justify-between mt-7 px-3 py-5 border-t  border-gray-200 dark:border-gray-700">
                      <UPagination v-model="domainPage" :page-count="pageCount" :total="domainRows.length" />
                      <div class="text-base dark:text-gray-300 text-gray-600 mb-2">
                        {{ domainRows.length }} total
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="mb-5 flex flex-col md:flex-row md:justify-around md:items-center gap-7">
                    <div class="flex justify-around items-center gap-7">
                      <div class="w-2xl">
                        <div>
                          <div class="text-sm">
                            Selected Sites
                          </div>
                          <div class="text-lg font-bold">
                            {{ selected.length }}/{{ maxSites }}
                          </div>
                          <UProgress :value="selected.length / maxSites * 100" :color="selected.length < maxSites ? 'purple' : 'red'" class="mt-1" />
                        </div>
                      </div>
                      <div class="max-w-[200px] text-gray-500 dark:text-gray-400 text-sm">
                        <UIcon name="i-heroicons-information-circle" class="w-4 h-4 -mb-1" />
                        You can upgrade your account later to support more sites.
                      </div>
                    </div>
                    <div class="max-w-[200px]">
                      <UButton class="mb-1" icon="i-heroicons-arrow-path" @click="sync">
                        Resync
                      </UButton>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        Made changes to Google Search Console? Resync your data.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <UDivider class="my-10" />
              <div>
                <div class="mb-7">
                  <h2 class="text-xl mb-2 font-bold flex items-center gap-3">
                    <UIcon name="i-carbon-data-backup" class="w-6 h-6 hidden md:block" />
                    Configure Google Search Console Backups
                  </h2>
                  <p class="text-gray-500 dark:text-gray-400 text-sm">
                    Google Search Console only stores your data for 16 months, you can backup your data so you never lose it.
                  </p>
                </div>
                <ul class="mb-7 space-y-3 md:ml-7">
                  <li class="flex items-center gap-1">
                    <UIcon name="i-heroicons-check" class="w-5 h-5" /> Backup your data before it gets deleted, view or download it at any time.
                  </li>
                  <li class="flex items-center gap-1">
                    <UIcon name="i-heroicons-check" class="w-5 h-5" /> See larger trends in your search performance on the dashboard.
                  </li>
                </ul>
                <div v-if="!isPending && selected.filter(s => s.isLosingData).length">
                  <p class="mb-3 max-w-lg">
                    Google Search Console is <strong>currently deleting</strong> data for the below domains because they were created 16 months ago.
                  </p>
                  <ul class="list-disc md:ml-7 text-center space-y-3 flex flex-col mb-7">
                    <li v-for="(s, key) in selected.filter(s => s.isLosingData)" :key="key" class="flex items-center gap-2 text-lg">
                      <UIcon v-if="!backups" name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-yellow-500" />
                      <img :src="`https://www.google.com/s2/favicons?domain=${s.siteUrl.replace('sc-domain:', 'https://')}`" alt="favicon" class="w-4 h-4">
                      <h3 class="font-bold">
                        {{ useFriendlySiteUrl(s.domain) }}
                      </h3>
                    </li>
                  </ul>
                </div>
                <label class="flex items-center dark:text-gray-300 text-gray-600 font-bold gap-3 mb-7">
                  <UToggle v-model="backups" color="blue" size="2xl" />
                  <div>Enable Backups</div>
                </label>
              </div>
            </div>
          </div>
          <template #footer>
            <div class="flex flex-col md:flex-row items-center gap-3">
              <UButton :loading="isSubmitting" type="submit" size="xl" :disabled="isPending || !selected.length">
                Continue to Dashboard
              </UButton>
              <div v-if="!isPending" class="text-gray-600 dark:text-gray-300 text-sm">
                <template v-if="selected.length">
                  You have selected {{ selected.length }} sites with backups {{ backups ? 'enabled' : 'disabled' }}.
                </template>
                <template v-else>
                  Please select at least one site.
                </template>
              </div>
            </div>
          </template>
        </UCard>
      </UForm>
    </UContainer>
  </div>
</template>

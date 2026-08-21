<script lang="ts" setup>
import type { SitePreview } from '~~/layers/core/app/types'
import { useJobListener } from '~~/layers/core/app/composables/events'

definePageMeta({
  layout: 'dashboard',
  title: 'Select your sites',
  icon: 'i-heroicons-globe-alt',
})

// `property` is kept alongside `domain` because `siteLabel()` falls back to it
// for sites imported from the old KV store, which carry a null `domain`.
type SitePreviewRow = SitePreview & { property: string | null }

interface SitesPreview {
  sites: SitePreviewRow[]
  jobStatus: string
  maxSites: number
}

const data = ref<SitesPreview>({ sites: [], jobStatus: 'pending', maxSites: 0 })
const key = ref(0)
const pending = ref(true)

const sitesSynced = ref(0)
const totalSites = ref(0)

const { fetch, session } = useUserSession()
const onSessionExpired = createSessionExpiredHandler()

// Fresh signups hold identity only: no Search Console grant, so `gscdumpUserId`
// is null and the picker has nothing to list. The dashboard layout pins every
// route here until onboarding completes, so this page is the only place a new
// user can be offered the connect flow from.
const isConnected = computed(() => Boolean(session.value?.gscdumpConnected))

async function refresh() {
  // TODO avoid duplicate fetches
  const result = await readSessionScoped(() => $fetch<SitesPreview>('/api/sites/preview')).finally(() => {
    pending.value = false
  })

  if (result._tag === 'SessionExpired') {
    await onSessionExpired()
    return
  }

  data.value = result.value
  sitesSynced.value = result.value.sites.filter(s => !!s.pageCount30Day).length
  totalSites.value = result.value.sites.length

  key.value++
}

const selectedSites = ref<string[]>([])
const toast = useToast()
const isSubmitting = ref(false)

const sites = computed(() => data.value.sites)
const maxSites = computed(() => data.value.maxSites)
const isStillSyncing = computed(() => data.value.jobStatus === 'pending')

/**
 * The picker used to be gated on `jobStatus === 'ready'`, so an account whose
 * lifecycle lookup stayed pending sat on the spinner forever even with every
 * site already synced. Sites are the gate now; a pending job status only adds a
 * progress banner above the picker.
 */
const showPicker = computed(() => !pending.value && sites.value.length > 0)
const isOverLimit = computed(() => maxSites.value > 0 && selectedSites.value.length > maxSites.value)
const canContinue = computed(() => showPicker.value && selectedSites.value.length > 0 && !isOverLimit.value)

const selectionHint = computed(() => {
  if (!showPicker.value)
    return ''
  if (!selectedSites.value.length)
    return 'Select at least one site.'
  if (isOverLimit.value)
    return `Too many sites selected. Deselect ${selectedSites.value.length - maxSites.value} to continue.`
  return `${selectedSites.value.length} of ${maxSites.value} sites selected. Search Console data is archived for each.`
})

async function onSubmit() {
  if (!canContinue.value)
    return
  isSubmitting.value = true
  await $fetch('/api/teams/currentTeam', {
    method: 'POST',
    body: JSON.stringify({
      onboardedStep: 'sites-and-backup', // maybe we change onboarding in future and they need to repeat it
      selectedSites: selectedSites.value,
      backupsEnabled: true,
    }),
  }).then(async () => {
    await fetch()
    toast.add({ title: 'You\'re all ready to go!', color: 'success' })
    navigateTo('/dashboard')
  }).catch((err) => {
    toast.add({ title: 'Failed to save your sites', description: err.message, color: 'error' })
  }).finally(() => {
    isSubmitting.value = false
  })
}

onMounted(() => refresh())

useJobListener('sites/setup', () => {
  refresh()
  sitesSynced.value++
  key.value++
})

function setSelectedSites(val: string[]) {
  selectedSites.value = val
}
</script>

<template>
  <UForm class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]" @submit="onSubmit">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-semibold">
          Select your sites
        </h1>
      </template>

      <div v-if="pending" class="py-10 text-center" role="status" aria-live="polite">
        <UIcon name="i-heroicons-arrow-path" class="size-10 animate-spin text-muted" />
        <p class="mt-3 text-xl">
          Fetching your data from Google Search Console.
        </p>
        <p class="text-sm text-muted">
          This can take a few minutes. Hold tight.
        </p>
      </div>

      <ConnectSearchConsoleCard
        v-else-if="!isConnected"
        return-to="/dashboard/team/setup"
      />

      <div v-else-if="!sites.length" class="py-10 text-center">
        <UIcon name="i-heroicons-exclamation-triangle" class="size-10 text-warning" />
        <p class="mt-3 text-xl">
          No sites found in Google Search Console
        </p>
        <p class="mt-1 text-sm text-muted">
          Add a property in <a href="https://search.google.com/search-console" target="_blank" class="underline">Google Search Console</a>, then check again.
        </p>
        <UButton class="mt-4 min-h-11" color="neutral" variant="outline" label="Check again" @click="refresh" />
      </div>

      <div v-else>
        <p class="mb-3 text-sm text-muted">
          These properties are <NuxtLink to="/" class="underline">
            domain split
          </NuxtLink> from your Google Search Console account. If you don't see your site, check it exists within
          <a class="underline" href="https://search.google.com/search-console" target="_blank">Google Search Console</a>.
        </p>
        <p v-if="maxSites" class="mb-5 text-sm text-muted">
          Free during the beta: up to {{ maxSites }} sites, up to 10,000 pages and tracking up to 100 keywords.
        </p>

        <div v-if="isStillSyncing" class="mb-5" role="status" aria-live="polite">
          <h2 class="mb-1 flex items-center gap-1 text-sm font-semibold">
            <UIcon name="i-heroicons-arrow-path" class="size-5 animate-spin" />
            Syncing sites {{ sitesSynced }}/{{ totalSites }}
          </h2>
          <UProgress :max="totalSites" :model-value="sitesSynced" />
          <p class="mt-1 text-xs text-muted">
            You can pick your sites now. Data keeps loading in the background.
          </p>
        </div>

        <TeamSiteSelector :key="key" :sites="sites" :max="maxSites" :model-value="selectedSites" @update:model-value="setSelectedSites" />
      </div>

      <template #footer>
        <div class="flex flex-col items-start gap-3 md:flex-row md:items-center">
          <UButton :loading="isSubmitting" type="submit" size="xl" :disabled="!canContinue">
            Continue to Dashboard
          </UButton>
          <div v-if="selectionHint" class="text-sm" :class="isOverLimit ? 'text-error' : 'text-muted'">
            {{ selectionHint }}
          </div>
        </div>
      </template>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-xl font-semibold">
          FAQ
        </h2>
      </template>
      <div class="space-y-5">
        <div>
          <h3 class="mb-2 text-base font-semibold">
            What does Request Indexing do?
          </h3>
          <div class="space-y-2">
            <p class="text-sm text-muted">
              1. Splits your property domains into easily trackable sites - <NuxtLink to="/guides" class="underline">
                what is domain property splitting
              </NuxtLink>.
            </p>
            <p class="text-sm text-muted">
              2. Requests Google to index your missing pages - <NuxtLink to="/google-indexing-api" class="underline">
                why you need to index your pages
              </NuxtLink>.
            </p>
            <p class="text-sm text-muted">
              3. Provides detailed GSC pages and keyword insights.
            </p>
            <p class="text-sm text-muted">
              4. Archives your Google Search Console data for as long as you like - <NuxtLink to="/guides" class="underline">
                why you need to archive your data
              </NuxtLink>.
            </p>
          </div>
        </div>
        <div>
          <h3 class="mb-2 text-base font-semibold">
            What do you do with my data?
          </h3>
          <p class="text-sm text-muted">
            We use your data to generate reports and insights to help you understand your search performance.
          </p>
          <p class="text-sm text-muted">
            We do not share your data with anyone.
          </p>
          <p class="text-sm text-muted">
            You can delete your data at any time.
          </p>
          <p class="text-sm text-muted">
            See our
            <NuxtLink class="underline" to="/privacy" target="_blank">
              privacy policy
            </NuxtLink> for more details.
          </p>
        </div>
        <div>
          <h3 class="mb-2 text-base font-semibold">
            What is domain property splitting?
          </h3>
          <p class="mb-2 text-sm text-muted">
            Google Search Console allows you submit either a domain or a URL property. Domain properties are recommended for most sites
            but they become difficult to track analytics when you have multiple subdomains.
          </p>
          <p class="text-sm text-muted">
            For example, if you have <code>example.com</code> and <code>blog.example.com</code> as separate properties, you can track them separately.
          </p>
        </div>
        <div>
          <h3 class="mb-2 text-base font-semibold">
            Why do I need to archive my data?
          </h3>
          <p class="text-sm text-muted">
            Google Search Console only stores your data for 16 months. Archiving keeps your data for as long as you like, and always shows it on your dashboard.
          </p>
        </div>
      </div>
    </UCard>
  </UForm>
</template>

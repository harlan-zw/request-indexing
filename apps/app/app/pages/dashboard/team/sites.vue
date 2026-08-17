<script lang="ts" setup>
import type { SitePreview } from '~~/layers/core/app/types'
import type { TaskMap } from '#shared/types/tasks'
import { fetchSites } from '~~/layers/core/app/composables/fetch'

definePageMeta({
  layout: 'dashboard',
  title: 'Sites',
  icon: 'i-heroicons-globe-alt',
})

// `property` is kept alongside `domain` because `siteLabel()` falls back to it
// for sites imported from the old KV store, which carry a null `domain`.
type SitePreviewRow = SitePreview & { property: string | null }

const data = ref<SitePreviewRow[]>([])

const { data: siteData } = await fetchSites()

const key = ref(0)
const pending = ref(true)
const isSynced = ref(false)
const sitesSynced = ref(0)
const totalSites = ref(0)
// The picker limit is owned by the API so page copy, counter, and save guard
// cannot drift apart. `0` means "not loaded yet" and hides the limit copy.
const maxSites = ref(0)

async function refresh() {
  // TODO avoid duplicate fetches
  const response = await $fetch('/api/sites/preview')
    .finally(() => {
      pending.value = false
    })
  data.value = response.sites.map((site): SitePreviewRow => ({
    ...site,
    domain: site.domain ?? '',
    property: site.property ?? null,
    startOfData: site.startOfData ?? '',
    sitemaps: site.sitemaps.map(sitemap => ({
      path: typeof sitemap.path === 'string' ? sitemap.path : undefined,
      errors: typeof sitemap.errors === 'string' || typeof sitemap.errors === 'number' ? sitemap.errors : undefined,
      warnings: typeof sitemap.warnings === 'string' || typeof sitemap.warnings === 'number' ? sitemap.warnings : undefined,
    })),
  }))
  isSynced.value = response.jobStatus === 'ready'
  maxSites.value = response.maxSites

  key.value++
}

const { user, fetch } = useUserSession()

const selectedSites = ref<string[]>(siteData.value?.sites?.map(s => String(s.siteId)) || [])
const toast = useToast()
const isSubmitting = ref(false)

const isSyncing = computed(() => !isSynced.value || sitesSynced.value < totalSites.value)
const isOverLimit = computed(() => maxSites.value > 0 && selectedSites.value.length > maxSites.value)
const canSave = computed(() => !pending.value && selectedSites.value.length > 0 && !isOverLimit.value)

const saveHint = computed(() => {
  if (pending.value)
    return ''
  if (!selectedSites.value.length)
    return 'Select at least one site.'
  if (isOverLimit.value)
    return `Too many sites selected. Deselect ${selectedSites.value.length - maxSites.value} to save.`
  return `${selectedSites.value.length} of ${maxSites.value} sites selected. Search Console data is archived for each.`
})

async function onSubmit() {
  if (!canSave.value)
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

let ws: WebSocket | undefined

async function connect() {
  const isSecure = location.protocol === 'https:'
  const url = `${(isSecure ? 'wss://' : 'ws://') + location.host}/_ws?userId=${user.value!.id}`
  ws && ws.close()

  ws = new WebSocket(url)

  ws.addEventListener('message', ({ data }) => {
    const job = JSON.parse(data) as { name: keyof TaskMap, payload: string }
    const payload = JSON.parse(job.payload) as { sites: unknown[] }
    if (job.name === 'sites/setup') {
      if (payload.sites.length > 1)
        totalSites.value += payload.sites.length
      sitesSynced.value++
    }
    refresh()
  })

  await new Promise(resolve => ws!.addEventListener('open', resolve))
}

onMounted(() => {
  refresh()
  connect()
})

onBeforeUnmount(() => ws?.close())
</script>

<template>
  <UForm class="max-w-5xl" @submit="onSubmit">
    <div class="mb-10 mx-3">
      <div>
        <p class="dark:text-gray-400 text-gray-600 text-sm mb-5">
          These properties come from your Google Search Console account. If you don't see your site, please
          check it exists within <a class="underline" href="https://search.google.com/search-console" target="_blank">Google Search Console</a>.
        </p>
        <ul class="mb-9 space-y-4">
          <li class="flex items-center gap-1">
            <UIcon name="i-heroicons-check" class="w-5 h-5" /> Sites are shown with domain property splitting.
          </li>
          <li v-if="maxSites" class="flex items-center gap-1">
            <UIcon name="i-heroicons-check" class="w-5 h-5" /> Connect up to {{ maxSites }} sites, update them at any time.
          </li>
        </ul>
        <div v-if="pending" class="mb-5 text-sm font-semibold flex items-center gap-1" role="status" aria-live="polite">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin w-5 h-5" />
          Loading your Search Console properties
        </div>
        <div v-else-if="isSyncing" class="mb-5" role="status" aria-live="polite">
          <h2 class="text-sm mb-1 font-semibold flex items-center gap-1">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin w-5 h-5" />
            <template v-if="totalSites">
              Syncing sites {{ sitesSynced }}/{{ totalSites }}
            </template>
            <template v-else>
              Syncing your Search Console data
            </template>
          </h2>
          <UProgress v-if="totalSites" :max="totalSites" :model-value="sitesSynced" />
          <p class="mt-1 text-xs text-muted">
            You can pick your sites now. Data keeps loading in the background.
          </p>
        </div>
        <h2 v-else class="text-sm mb-3 font-semibold flex items-center gap-1" role="status">
          <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-primary" />
          All sites synced.
        </h2>
        <TeamSiteSelector v-if="data?.length" :key="key" :sites="data" :max="maxSites" :model-value="selectedSites" @update:model-value="e => selectedSites = e" />
      </div>
    </div>
    <div>
      <div class="flex flex-col md:flex-row items-center gap-3">
        <UButton :loading="isSubmitting" type="submit" size="lg" :disabled="!canSave">
          Save
        </UButton>
        <div v-if="saveHint" class="text-sm" :class="isOverLimit ? 'text-error' : 'text-gray-600 dark:text-gray-300'">
          {{ saveHint }}
        </div>
      </div>
    </div>
  </UForm>
</template>

<script lang="ts" setup>
import type { SitePreview } from '~/types'
import type { TaskMap } from '~/server/plugins/eventServiceProvider'
import { fetchSites } from '~/composables/fetch'

definePageMeta({
  layout: 'dashboard',
  title: 'Sites',
  icon: 'i-heroicons-users',
})

const data = ref<SitePreview[]>([])

const { data: siteData } = await fetchSites()
console.log(siteData)
// watch(siteData, () => {
//   data.value = siteData || []
// }, {
//   immediate: true,
// })

// const { data, pending, refresh, forceRefresh } = fetchSites('all')
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
  if (data.value.filter(s => !!s.lastSynced).length)
    isSetup.value = true

  key.value++
}

const { user, fetch } = useUserSession()

const isPending = computed(() => pending.value || data.value?.isPending)
const backups = ref(true)
const selectedSites = ref<string[]>(siteData.value?.sites?.map(s => s.siteId) || [])
const maxSites = 6
const toast = useToast()
const submitError = ref('')
const isSubmitting = ref(false)

// watch(data, d => {
//   console.log('got data', d)
//   selectedSites.value = d || []
// })

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

let ws: WebSocket | undefined

async function connect() {
  const isSecure = location.protocol === 'https:'
  console.log('wss connect', user.value!.userId)
  const url = `${(isSecure ? 'wss://' : 'ws://') + location.host}/_ws?userId=${user.value!.userId}`
  ws && ws.close()

  ws = new WebSocket(url)

  ws.addEventListener('message', ({ data }) => {
    const job = JSON.parse(data) as { name: keyof TaskMap, payload: any }
    const payload = JSON.parse(job.payload)
    console.log('ws message', job.name, payload)
    if (job.name === 'users/syncGscSites') {
      totalSites.value = payload.sites.length
      isSetup.value = true
    }
    if (job.name === 'sites/setup') {
      if (payload.sites.length > 1)
        totalSites.value += payload.sites.length
      isSetup.value = true
      sitesSynced.value++
    }
    // TODO handle payload event
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

function setSelectedSites(val) {
  selectedSites.value = val
}
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
          <li class="flex items-center gap-1">
            <UIcon name="i-heroicons-check" class="w-5 h-5" /> Connect up to {{ maxSites }} sites on the free plan, update them at any time.
          </li>
        </ul>
        <div v-if="sitesSynced < totalSites">
          <div class="text-sm mb-1 font-semibold text-center">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin w-5 h-5" />
            Syncing sites {{ sitesSynced }}/{{ totalSites }}
          </div>
          <UProgress :max="totalSites" :value="sitesSynced" class="mb-5" />
        </div>
        <div v-else>
          <div class="text-sm mb-1 font-semibold text-center">
            All sites synced.
          </div>
        </div>
        <TeamSiteSelector v-if="data?.length" :key="key" :sites="data" :model-value="selectedSites" @update:model-value="e => selectedSites = e" />
      </div>
    </div>
    <div>
      <div class="flex flex-col md:flex-row items-center gap-3">
        <UButton :loading="isSubmitting" type="submit" size="lg" :disabled="isPending || !selectedSites.length">
          Save
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
    </div>
  </UForm>
</template>

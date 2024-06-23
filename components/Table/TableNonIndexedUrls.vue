<script setup lang="ts">
import { joinURL, withBase, withHttps } from 'ufo'
import { defu } from 'defu'
import { useTimeAgo } from '~/composables/formatting'
import { createLogoutHandler, createSessionReloader, useAuthenticatedUser } from '~/composables/auth'
import type { GoogleSearchConsoleSite, SitePage } from '~/types'

const props = defineProps<{ mock?: boolean, value: SitePage[], site: GoogleSearchConsoleSite }>()

const logout = createLogoutHandler()
const user = useAuthenticatedUser()
const reloadSession = createSessionReloader()

const toast = useToast()
const params = useUrlSearchParams('history')
const autoRequestIndex = ref(false)

const q = ref(params.q || '')
const page = ref(params.page || 1)

watch(q, (q) => {
  params.q = q
})
watch(page, (page) => {
  params.page = page
})

const columns = [{
  key: 'url',
  label: 'URL',
  sortable: true,
}, {
  key: 'inspection',
  label: 'URL Inspection',
  icon: 'i-heroicons-magnifying-glass',
}, {
  key: 'requestIndexing',
  label: 'Request Indexing',
}, props.mock
  ? false
  : {
      key: 'actions',
    }].filter(Boolean)

const siteUrlFriendly = useFriendlySiteUrl(props.site.siteUrl)
const inspectionsLoading = ref([])
const submitIndexingLoading = ref([])
const updatedUrls = ref([])
async function inspectUrl(row: SitePage) {
  if (props.mock)
    return

  const siteUrl = withHttps(siteUrlFriendly)
  inspectionsLoading.value = [...inspectionsLoading.value, row.url]
  await $fetch<SitePage>(`/api/sites/${encodeURIComponent(props.site.siteUrl)}/${encodeURIComponent(withBase(row.url, siteUrl))}`, {
    timeout: 90000, // 90 seconds
  })
    .finally(() => {
      inspectionsLoading.value = inspectionsLoading.value.filter(url => url !== row.url)
    }).then((data) => {
      toast.add({
        color: 'green',
        title: `Inspected URL Successfully`,
        description: `Received a verdict of ${data.inspectionResult?.indexStatusResult.verdict}.`,
      })
      pushUpdatedUrls(data, row)
    })
    .catch(async (err) => {
      if (err.status === 401) {
        // make sure we have context
        await logout(true)
        toast.add({
          id: 'unauthorized-error',
          title: 'Oops, looks like session has expired.',
          description: 'Please login again to continue.',
          color: 'red',
        })
      }
      else if (err.status === 429) {
        toast.add({
          color: 'red',
          title: 'Rate Limited',
          description: err.statusText,
        })
      }
      else {
        toast.add({
          color: 'red',
          title: 'Failed to inspect the URL.',
          description: err.statusText || err.message,
        })
      }
    })
}

function getUpdatedRow(row: SitePage) {
  return updatedUrls.value.find(result => result.url === row.url) || row
}

function getUrlNotificationLatestUpdate(row: SitePage) {
  return updatedUrls.value.find(result => result.url === row.url)?.urlNotificationMetadata?.latestUpdate || row.urlNotificationMetadata?.latestUpdate
}

function pushUpdatedUrls(data: SitePage, row: SitePage) {
  let updatedUrl
  updatedUrls.value = updatedUrls.value.map((result) => {
    if (result.url === row.url) {
      updatedUrl = true
      return { ...defu(data, result, row), url: row.url }
    }
    return result
  })
  if (!updatedUrl)
    updatedUrls.value = [...updatedUrls.value, { ...defu(data, row), url: row.url }]
}
const { pause: pauseAutoRequestIndex, resume: resumeAutoRequestIndex } = useTimeoutPoll(pollForRequestIndex, 2000, { immediate: false })

async function submitForIndexing(row: SitePage) {
  if (props.mock)
    return

  const siteUrl = withHttps(siteUrlFriendly)
  submitIndexingLoading.value = [...submitIndexingLoading.value, row.url]
  const { url: data, status } = await $fetch<{ status: 'already-submitted' | 'submitted', url: SitePage }>(`/api/indexing/${encodeURIComponent(withBase(row.url, siteUrl))}`, {
    method: 'POST',
    timeout: 90000, // 90 seconds
    query: { siteUrl },
    onResponseError({ response }) {
      // handle 429
      if (response.status === 429) {
        toast.add({
          color: 'red',
          title: 'Rate Limited',
          description: response.statusText,
        })
      }
      else {
        toast.add({
          color: 'red',
          title: 'Failed to submit the URL for indexing.',
          description: response.statusText,
        })
      }
    },
  }).catch((e) => {
    pauseAutoRequestIndex()
    submitIndexingLoading.value = submitIndexingLoading.value.filter(url => url !== row.url)
    throw e
  })
  if (status === 'already-submitted') {
    const hoursAgo = useDayjs()(data.urlNotificationMetadata?.latestUpdate?.notifyTime).fromNow()
    toast.add({
      color: 'blue',
      title: 'Already Submitted',
      description: `This URL was submitted for indexing ${hoursAgo}.`,
    })
  }
  else {
    toast.add({
      color: 'green',
      title: 'Submitted',
      description: 'Your URL has been submitted for indexing.',
    })
    await reloadSession()
  }
  pushUpdatedUrls(data, row)
  submitIndexingLoading.value = submitIndexingLoading.value.filter(url => url !== row.url)
}

function hasOneHourPassed(date?: string | number) {
  if (!date)
    return true
  return useDayjs()().diff(useDayjs()(date), 'hour') >= 1
}

function hasOneDayPassed(date?: string | number) {
  if (!date)
    return true
  return useDayjs()().diff(useDayjs()(date), 'day') >= 1
}

function openUrl(url: string, target?: string) {
  window.open(url, target)
}

const visibleRows = ref([])

const { pause, resume } = useTimeoutPoll(pollForInspectUrl, 2000, { immediate: false })

async function pollForInspectUrl() {
  const row = [...visibleRows.value]
    .map(row => getUpdatedRow(row))
    .filter((row) => {
      if (row.inspectionResult?.indexStatusResult?.verdict && row.inspectionResult?.indexStatusResult?.verdict !== 'NEUTRAL')
        return false

      if (row.lastInspected) {
        // if url has been submitted for indexing, we will trigger it after one day
        if (row.urlNotificationMetadata?.latestUpdate?.type === 'URL_UPDATED')
          return hasOneDayPassed(row.lastInspected)
        return false
      }

      return true
    })
    .shift()
  if (row)
    await inspectUrl(row)
  else
    pause()
}

watch(visibleRows, () => {
  resume()
}, {
  immediate: true,
})

async function pollForRequestIndex() {
  const row = [...visibleRows.value]
    .map(row => getUpdatedRow(row))
    .filter(row => row.inspectionResult?.indexStatusResult?.verdict === 'NEUTRAL' && getUrlNotificationLatestUpdate(row)?.type !== 'URL_UPDATED')
    .shift()
  if (row)
    await submitForIndexing(row)
  else
    pauseAutoRequestIndex()
}

watch([visibleRows, autoRequestIndex], () => {
  if (autoRequestIndex.value && user.value.indexingOAuthIdNext)
    resumeAutoRequestIndex()
}, {
  immediate: true,
})

const filters = [
  {
    key: 'new',
    label: 'Hide Actioned',
    description: 'Hide pages indexed or requested indexing pages.',
    filter: (rows: any) => {
      return rows.filter((row) => {
        row = getUpdatedRow(row)
        if (row.inspectionResult?.indexStatusResult?.verdict && row.inspectionResult?.indexStatusResult?.verdict !== 'NEUTRAL')
          return false

        // if url has been submitted for indexing, we will trigger it after one day
        if (row.urlNotificationMetadata?.latestUpdate?.type === 'URL_UPDATED')
          return hasOneDayPassed(row.lastInspected)

        return true
      })
    },
  },
]
</script>

<template>
  <div v-if="!mock" class="flex justify-between mb-3">
    <div v-if="value?.length">
      <div>
        <UTooltip :ui="{ width: 'max-w-md' }" text="Non-Indexed pages are initially guessed from your page impressions.">
          <div><strong>{{ value.filter(row => getUpdatedRow(row).inspectionResult?.indexStatusResult?.verdict === 'NEUTRAL').length }}</strong> Confirmed non-indexed pages.</div>
        </UTooltip>
      </div>
      <div>
        <UTooltip :ui="{ width: 'max-w-md' }" text="Total pages that you've 'Requested Indexing' on">
          <div><strong>{{ value.filter(row => !!getUpdatedRow(row)?.urlNotificationMetadata?.latestUpdate).length }}</strong> Indexing requests.</div>
        </UTooltip>
      </div>
    </div>
    <div v-if="site.permissionLevel === 'siteOwner'">
      <UTooltip text="Automatically trigger the Request Indexing button.">
        <label class="flex items-center gap-2 text-sm font-semibold">
          Auto Request Indexing
          <UToggle
            v-model="autoRequestIndex"
            on-icon="i-heroicons-check-20-solid"
            off-icon="i-heroicons-x-mark-20-solid"
          />
        </label>
      </UTooltip>
    </div>
  </div>
  <TableData :columns="columns" :value="value" :filters="mock ? [] : filters" @update:rows="rows => visibleRows = rows">
    <template #url-data="{ row }">
      <div style="max-width: 400px;" class="flex flex-col">
        <UButton :title="row.url" variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" :to="joinURL(`https://${siteUrlFriendly}`, row.url)" target="_blank" color="gray" class="w-full">
          <div class="max-w-[300px] truncate text-ellipsis">
            {{ row.url }}
          </div>
        </UButton>
        <UTooltip v-if="getUpdatedRow(row)?.inspectionResult?.inspectionResultLink" mode="hover" text="View Inspection Result">
          <UButton size="xs" target="_blank" :to="mock ? undefined : getUpdatedRow(row)?.inspectionResult?.inspectionResultLink" icon="i-heroicons-document-magnifying-glass" color="gray" variant="link">
            View Inspection Report
          </UButton>
        </UTooltip>
      </div>
    </template>
    <template #inspection-data="{ row }">
      <div>
        <InspectionResult :value="getUpdatedRow(row)">
          <template v-if="getUrlNotificationLatestUpdate(row)?.type === 'URL_UPDATED' || getUpdatedRow(row)?.inspectionResult?.indexStatusResult?.verdict === 'NEUTRAL'">
            <UDivider class="my-3" />
            <div class="flex items-center justify-between">
              <div class="text-gray-600">
                <span class="text-sm">Inspected</span><br>
                {{ $dayjs(getUpdatedRow(row)?.lastInspected).fromNow() }}
              </div>
              <div v-if="getUpdatedRow(row)?.lastInspected && !hasOneHourPassed(row?.lastInspected)">
                <UButton :disabled="mock" color="gray" size="xs" class="mt-2" icon="i-heroicons-arrow-path" :loading="inspectionsLoading.includes(row.url)" @click="inspectUrl(row)">
                  Inspect Again
                </UButton>
              </div>
              <div v-else>
                <UButton :disabled="mock" color="gray" size="xs" class="mt-2" icon="i-heroicons-arrow-path" :loading="inspectionsLoading.includes(row.url)" @click="inspectUrl(row)">
                  Inspect Again
                </UButton>
              </div>
            </div>
          </template>
        </InspectionResult>
        <div v-if="!getUpdatedRow(row)?.lastInspected">
          <UButton size="xs" color="gray" :loading="inspectionsLoading.includes(row.url)" @click="inspectUrl(row)">
            Inspect
          </UButton>
        </div>
        <div v-else-if="hasOneHourPassed(getUpdatedRow(row)?.lastInspected) && getUpdatedRow(row)?.inspectionResult?.indexStatusResult?.verdict === 'NEUTRAL'">
          <UButton size="xs" color="gray" :loading="inspectionsLoading.includes(row.url)" @click="inspectUrl(row)">
            Inspect Again
          </UButton>
        </div>
      </div>
    </template>

    <template #requestIndexing-header>
      <div class="flex justify-end">
        <div class="flex items-center gap-2">
          Request Indexing
        </div>
      </div>
    </template>
    <template #requestIndexing-data="{ row }">
      <div class="flex justify-end">
        <div v-if="getUrlNotificationLatestUpdate(row)?.type !== 'URL_UPDATED' && getUpdatedRow(row)?.inspectionResult?.indexStatusResult.verdict === 'NEUTRAL'" class="flex items-center gap-2">
          <UButton :disabled="!mock && (!user?.indexingOAuthIdNext || site.permissionLevel !== 'siteOwner')" size="xs" :loading="submitIndexingLoading.includes(row.url)" icon="i-heroicons-arrow-up-circle" variant="outline" @click="submitForIndexing(row)">
            Request Indexing
          </UButton>
        </div>
        <div v-else-if="getUrlNotificationLatestUpdate(row)?.type === 'URL_UPDATED'" class="flex items-center text-right">
          <div><span class="text-xs">Submitted</span><br>{{ useTimeAgo(getUrlNotificationLatestUpdate(row).notifyTime) }}</div>
        </div>
        <div v-else>
          <div class="w-5 h-[2px] dark:bg-gray-800 bg-gray-200" />
        </div>
      </div>
    </template>
    <template #actions-data="{ row }">
      <UDropdown :items="[[{ label: 'Open URL', click: () => openUrl(joinURL(`https://${siteUrlFriendly}`, row.url), '_blank'), icon: 'i-heroicons-arrow-up-right' }]]">
        <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
      </UDropdown>
    </template>
  </TableData>
</template>

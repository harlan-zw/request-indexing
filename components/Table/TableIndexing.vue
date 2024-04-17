<script setup lang="ts">
import { withBase, withHttps } from 'ufo'
import { defu } from 'defu'
import { useTimeAgo } from '~/composables/formatting'
import { createLogoutHandler, createSessionReloader, useAuthenticatedUser } from '~/composables/auth'
import type { GoogleSearchConsoleSite, SitePage } from '~/types'

const props = defineProps<{ mock?: boolean, value: SitePage[], site: GoogleSearchConsoleSite }>()

const logout = createLogoutHandler()
const user = useAuthenticatedUser()
const reloadSession = createSessionReloader()

const toast = useToast()

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

const siteUrlFriendly = useFriendlySiteUrl(props.site.domain)
const inspectionsLoading = ref([])
const submitIndexingLoading = ref([])
const updatedUrls = ref([])
async function inspectUrl(row: SitePage) {
  if (props.mock)
    return

  const siteUrl = withHttps(siteUrlFriendly)
  inspectionsLoading.value = [...inspectionsLoading.value, row.url]
  await $fetch<SitePage>(`/api/sites/${encodeURIComponent(props.site.domain)}/url-inspection/${encodeURIComponent(withBase(row.url, siteUrl))}`, {
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

function openUrl(url: string, target?: string) {
  window.open(url, target)
}

const { pause, resume } = useTimeoutPoll(pollForInspectUrl, 2000, { immediate: false })

async function pollForInspectUrl() {
  const row = [...paginatedRows.value]
    .map(row => getUpdatedRow(row))
    .filter(row => !row.inspectionResult)
    .shift()
  if (row)
    await inspectUrl(row)
  else
    pause()
}

watch(paginatedRows, () => {
  resume()
}, {
  immediate: true,
})
</script>

<template>
  <div>
    <TableData :columns="columns" :value="value">
      <template #url-data="{ row }">
        <div class="flex flex-col" style="max-width: 400px;">
          <UButton :title="row.url" variant="link" size="xs" :class="mock ? ['pointer-events-none'] : []" :to="row.url" target="_blank" color="gray" class="w-full">
            <div class="max-w-[300px] truncate text-ellipsis">
              {{ row.url }}
            </div>
          </UButton>
          <UButton v-if="row.sitemap" size="xs" variant="link" :to="row.sitemap" class="text-xs text-gray-400">
            {{ row.sitemap.replace('https://', '') }}
          </UButton>
          <UTooltip v-if="getUpdatedRow(row)?.inspectionResult?.inspectionResultLink" mode="hover" text="View Inspection Result">
            <UButton size="xs" target="_blank" :to="getUpdatedRow(row)?.inspectionResult?.inspectionResultLink" :icon="mock ? undefined : 'i-heroicons-document-magnifying-glass'" color="gray" variant="link">
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
            <UButton :disabled="!mock && (!user?.indexingOAuthId || site.permissionLevel !== 'siteOwner')" size="xs" :loading="submitIndexingLoading.includes(row.url)" icon="i-heroicons-arrow-up-circle" variant="outline" @click="submitForIndexing(row)">
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
        <UDropdown :items="[[{ label: 'Open URL', click: () => openUrl(row.url, '_blank'), icon: 'i-heroicons-arrow-up-right' }]]">
          <UButton variant="link" icon="i-heroicons-ellipsis-vertical" color="gray" />
        </UDropdown>
      </template>
    </TableData>
  </div>
</template>

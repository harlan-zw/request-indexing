<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Web Indexing',
  icon: 'i-ph-check-circle-duotone',
})

const toast = useToast()

// `sites.gscdumpSiteId` is nullable. Rendering the data cards without it leaves
// three boxes that can never fill, so say so once instead.
const hasSyncedSite = computed(() => Boolean(site.gscdumpSiteId))

// `siteLabel` already normalises a domain or an `sc-domain:` property down to
// a bare host, so the input starts on the right site.
const url = ref(siteLabel(site) ? `https://${siteLabel(site)}/` : '')
const submitting = ref(false)

type SubmitState
  = | { _tag: 'Idle' }
    | { _tag: 'Ok', url: string, status: string }
    | { _tag: 'Err', message: string }

const lastSubmit = ref<SubmitState>({ _tag: 'Idle' })

function parseAbsoluteUrl(value: string): URL | null {
  try {
    const parsed = new URL(value.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null
  }
  catch {
    return null
  }
}

function errorMessage(error: unknown): string {
  const e = error as { statusMessage?: string, data?: { statusMessage?: string, message?: string }, message?: string }
  return e?.data?.statusMessage || e?.statusMessage || e?.data?.message || e?.message || 'The request could not be sent.'
}

async function submitForIndexing() {
  const target = parseAbsoluteUrl(url.value)
  if (!target) {
    lastSubmit.value = { _tag: 'Err', message: 'Enter a full URL, including https:// and the page path.' }
    return
  }

  submitting.value = true
  const result = await $fetch<{ status: string, url: string }>(`/api/indexing/${encodeURIComponent(target.toString())}`, {
    method: 'POST',
    query: { siteId: String(site.siteId) },
  })
    .then(response => ({ _tag: 'Ok' as const, response }))
    .catch((error: unknown) => ({ _tag: 'Err' as const, error }))
  submitting.value = false

  if (result._tag === 'Err') {
    const message = errorMessage(result.error)
    lastSubmit.value = { _tag: 'Err', message }
    toast.add({ title: 'Indexing request failed', description: message, color: 'error' })
    return
  }

  const status = result.response.status === 'already-submitted'
    ? 'Google was already told about this URL in the last 48 hours.'
    : 'Google was told this URL changed. Indexing can still take a few days.'
  lastSubmit.value = { _tag: 'Ok', url: target.toString(), status }
  toast.add({ title: 'Indexing requested', description: status, color: 'success' })
}
</script>

<template>
  <div class="space-y-7">
    <div class="grid grid-cols-1 gap-7 lg:grid-cols-12">
      <div class="space-y-7 lg:col-span-9">
        <!-- WI2: the product's namesake action. `/api/indexing/[url]` already
             exists; nothing on this page called it. -->
        <div>
          <CardTitle>Request indexing</CardTitle>
          <UCard>
            <form class="flex flex-wrap items-end gap-3" @submit.prevent="submitForIndexing">
              <UFormField label="Page URL" class="min-w-0 grow" help="Tell Google this page is new or has changed.">
                <UInput
                  v-model="url"
                  class="w-full"
                  type="url"
                  autocomplete="off"
                  placeholder="https://example.com/blog/my-post"
                />
              </UFormField>
              <UButton type="submit" :loading="submitting" :disabled="!url.trim()">
                Request indexing
              </UButton>
            </form>
            <p v-if="lastSubmit._tag === 'Err'" class="mt-3 text-sm text-error">
              {{ lastSubmit.message }}
            </p>
            <p v-else-if="lastSubmit._tag === 'Ok'" class="mt-3 text-sm text-muted">
              {{ lastSubmit.status }}
            </p>
          </UCard>
        </div>

        <UCard v-if="!hasSyncedSite" :ui="{ body: 'sm:px-3 sm:py-2' }">
          <div class="py-4 text-sm text-muted">
            This site is not synced with Search Console yet, so there is no indexing history to show.
          </div>
        </UCard>
        <template v-else>
          <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
            <GscdumpIndexingSummary :site-id="site.gscdumpSiteId" />
          </UCard>
          <div>
            <CardTitle>URLs</CardTitle>
            <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
              <div class="overflow-x-auto">
                <GscdumpIndexingUrls class="min-w-[44rem] md:min-w-0" :site-id="site.gscdumpSiteId" />
              </div>
            </UCard>
          </div>
        </template>
      </div>
      <div class="space-y-7 lg:col-span-3">
        <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
          <h2 class="mb-2 flex items-center text-sm font-semibold">
            <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
            How it works
          </h2>
          <!-- WI3: `gscdump` is an internal name. Users know Search Console. -->
          <div class="text-sm text-gray-500 mb-1">
            Indexing status comes from the Search Console URL Inspection API.
          </div>
          <div class="text-sm text-gray-500">
            URLs are re-checked regularly, so their status is tracked over time.
          </div>
        </UCard>
        <div v-if="hasSyncedSite">
          <CardTitle>Diagnostics</CardTitle>
          <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
            <GscdumpIndexingDiagnostics :site-id="site.gscdumpSiteId" />
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Sitemaps',
  icon: 'i-ph-map-trifold-duotone',
})

const toast = useToast()

const sitemapUrl = ref(siteLabel(site) ? `https://${siteLabel(site)}/sitemap.xml` : '')
const busy = ref<'submit' | 'refresh' | null>(null)

function errorMessage(error: unknown): string {
  const e = error as { statusMessage?: string, data?: { statusMessage?: string, message?: string }, message?: string }
  return e?.data?.statusMessage || e?.statusMessage || e?.data?.message || e?.message || 'The request could not be sent.'
}

// The component owns the fetch; its `useAsyncData` key is derived from the
// gscdump site id, so re-read it by key rather than reaching into the child.
function reloadSitemaps() {
  return refreshNuxtData(`gscdump:sitemaps:${site.gscdumpSiteId}`)
}

async function callSitemaps(action: 'submit' | 'refresh') {
  if (action === 'submit') {
    try {
      const parsed = new URL(sitemapUrl.value.trim())
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
        throw new Error('protocol')
    }
    catch {
      toast.add({ title: 'Enter a full sitemap URL', description: 'For example https://example.com/sitemap.xml', color: 'error' })
      return
    }
  }

  busy.value = action
  const result = await $fetch(`/api/gscdump/${site.siteId}/sitemaps`, {
    method: 'POST',
    body: action === 'refresh'
      ? { action: 'refresh' }
      : { action: 'submit', sitemapUrl: sitemapUrl.value.trim() },
  })
    .then(() => ({ _tag: 'Ok' as const }))
    .catch((error: unknown) => ({ _tag: 'Err' as const, error }))
  busy.value = null

  if (result._tag === 'Err') {
    toast.add({
      title: action === 'refresh' ? 'Refresh failed' : 'Sitemap not submitted',
      description: errorMessage(result.error),
      color: 'error',
    })
    return
  }

  toast.add({
    title: action === 'refresh' ? 'Refreshed from Search Console' : 'Sitemap submitted',
    description: action === 'refresh'
      ? 'Sitemap status is up to date.'
      : 'Google will fetch it shortly. Status updates once it has.',
    color: 'success',
  })
  await reloadSitemaps()
}
</script>

<template>
  <div class="space-y-7">
    <!-- SM5: `/api/gscdump/[siteId]/sitemaps` already supports submit and
         refresh; nothing on this page called it. -->
    <div>
      <CardTitle>Submit a sitemap</CardTitle>
      <UCard>
        <form class="flex flex-wrap items-end gap-3" @submit.prevent="callSitemaps('submit')">
          <UFormField label="Sitemap URL" class="min-w-0 grow" help="Send a new sitemap to Search Console, or resubmit one it already knows.">
            <UInput
              v-model="sitemapUrl"
              class="w-full"
              type="url"
              autocomplete="off"
              placeholder="https://example.com/sitemap.xml"
            />
          </UFormField>
          <UButton type="submit" :loading="busy === 'submit'" :disabled="!sitemapUrl.trim()">
            Submit
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-heroicons-arrow-path"
            :loading="busy === 'refresh'"
            @click="callSitemaps('refresh')"
          >
            Refresh status
          </UButton>
        </form>
      </UCard>
    </div>

    <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
      <div class="overflow-x-auto">
        <GscdumpSitemaps class="min-w-[44rem] md:min-w-0" :site-id="site.gscdumpSiteId" />
      </div>
    </UCard>
  </div>
</template>

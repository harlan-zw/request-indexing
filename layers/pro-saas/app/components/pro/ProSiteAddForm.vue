<script setup lang="ts">
import { parseSiteUrlInput } from '#layers/pro-saas/shared/site-url'

// Connect a site by address. Search Console properties are offered as
// one-click suggestions, not as the only way in: an account with no verified
// property used to reach this screen with nothing to pick and no way forward.
const { gscReturnTo = '/pro/dashboard/onboarding?step=sites' } = defineProps<{
  gscReturnTo?: string
}>()

const emit = defineEmits<{ changed: [count: number] }>()

interface ConnectedSite {
  siteId: string
  domain: string | null
  property: string | null
}

interface SitesPreviewResponse {
  sites: ConnectedSite[]
  maxSites: number
}

interface GscProperty {
  siteUrl: string
  permissionLevel: string
  matchingSite: { siteId: string } | null
}

interface GscPropertiesResponse {
  connected: boolean
  properties: GscProperty[]
  error?: { reason: string, message: string }
}

const toast = useToast()

const { data: preview, refresh: refreshSites, status: sitesStatus } = await useFetch<SitesPreviewResponse>('/api/sites/preview', {
  key: 'onboarding-connected-sites',
  server: false,
  default: () => ({ sites: [], maxSites: 0 }),
})

const { data: gsc, refresh: refreshGsc, status: gscStatus } = await useFetch<GscPropertiesResponse>('/api/pro/gsc-properties', {
  key: 'onboarding-gsc-properties',
  server: false,
  default: () => ({ connected: false, properties: [] }),
})

const connectedSites = computed(() => preview.value?.sites ?? [])
const maxSites = computed(() => preview.value?.maxSites ?? 0)
const atLimit = computed(() => maxSites.value > 0 && connectedSites.value.length >= maxSites.value)

watch(connectedSites, sites => emit('changed', sites.length), { immediate: true })

const connectedDomains = computed(() => new Set(connectedSites.value.map(s => s.domain).filter(Boolean) as string[]))

/** Search Console properties that are not connected yet, deduped by domain. */
const suggestions = computed(() => {
  const seen = new Set<string>()
  const out: { siteUrl: string, domain: string, verified: boolean }[] = []
  for (const property of gsc.value?.properties ?? []) {
    const parsed = parseSiteUrlInput(property.siteUrl)
    if (parsed._tag === 'Err')
      continue
    if (connectedDomains.value.has(parsed.domain) || seen.has(parsed.domain))
      continue
    seen.add(parsed.domain)
    out.push({
      siteUrl: property.siteUrl,
      domain: parsed.domain,
      verified: property.permissionLevel !== 'siteUnverifiedUser',
    })
  }
  return out
})

const gscConnectUrl = computed(() => `/auth/integrations/gsc/connect?returnTo=${encodeURIComponent(gscReturnTo)}`)

const url = ref('')
const submitting = ref<string | null>(null)
const inlineError = ref('')

const typedError = computed(() => {
  if (!url.value.trim())
    return ''
  const parsed = parseSiteUrlInput(url.value)
  return parsed._tag === 'Err' ? parsed.message : ''
})

async function connect(value: string) {
  if (submitting.value)
    return
  inlineError.value = ''

  const parsed = parseSiteUrlInput(value)
  if (parsed._tag === 'Err') {
    inlineError.value = parsed.message
    return
  }

  submitting.value = parsed.domain
  try {
    await $fetch('/api/pro/sites', { method: 'POST', body: { url: parsed.origin } })
    url.value = ''
    await Promise.all([refreshSites(), refreshGsc()])
    toast.add({ title: `Connected ${parsed.domain}`, color: 'success' })
  }
  catch (err: unknown) {
    const message = (err as { data?: { message?: string } })?.data?.message
    inlineError.value = message || 'Could not connect that site.'
  }
  finally {
    submitting.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="connectedSites.length" class="space-y-2">
      <h2 class="text-sm font-semibold text-highlighted">
        Connected
      </h2>
      <ul class="space-y-2">
        <li
          v-for="site in connectedSites"
          :key="site.siteId"
          class="flex items-center gap-2 rounded-lg border border-default bg-elevated/40 px-3 py-2"
        >
          <UIcon name="i-heroicons-check-circle" class="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span class="truncate text-sm text-highlighted">{{ site.domain || site.property }}</span>
        </li>
      </ul>
      <p v-if="maxSites" class="text-xs text-muted">
        {{ connectedSites.length }} of {{ maxSites }} sites connected.
      </p>
    </div>

    <form class="space-y-2" @submit.prevent="connect(url)">
      <UFormField label="Site address" :error="inlineError || typedError || undefined">
        <div class="flex flex-col gap-2 sm:flex-row">
          <UInput
            v-model="url"
            placeholder="example.com"
            autocapitalize="off"
            autocorrect="off"
            spellcheck="false"
            class="w-full"
            :disabled="atLimit"
          />
          <UButton
            type="submit"
            size="lg"
            class="min-h-11 shrink-0"
            label="Connect"
            :loading="!!submitting"
            :disabled="!url.trim() || !!typedError || atLimit"
          />
        </div>
      </UFormField>
      <p v-if="atLimit" class="text-xs text-muted">
        You have connected the maximum of {{ maxSites }} sites.
      </p>
    </form>

    <div v-if="gscStatus === 'pending'" class="text-sm text-muted" role="status" aria-live="polite">
      Reading your Search Console properties.
    </div>

    <div v-else-if="gsc?.error" class="space-y-2">
      <ProAlert color="warning" :title="gsc.error.message" />
      <UButton :to="gscConnectUrl" external color="neutral" variant="subtle" class="min-h-11" label="Reconnect Google" />
    </div>

    <div v-else-if="suggestions.length" class="space-y-2">
      <h2 class="text-sm font-semibold text-highlighted">
        From your Search Console
      </h2>
      <ul class="space-y-2">
        <li
          v-for="s in suggestions"
          :key="s.siteUrl"
          class="flex items-center gap-3 rounded-lg border border-default px-3 py-2"
        >
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm text-highlighted">
              {{ s.domain }}
            </div>
            <div v-if="!s.verified" class="text-xs text-warning">
              Not verified in Search Console yet.
            </div>
          </div>
          <UButton
            color="neutral"
            variant="subtle"
            size="sm"
            class="min-h-11 shrink-0"
            label="Connect"
            :loading="submitting === s.domain"
            :disabled="atLimit || !!submitting"
            @click="connect(s.siteUrl)"
          />
        </li>
      </ul>
    </div>

    <p v-else-if="sitesStatus !== 'pending' && gsc?.connected" class="text-sm text-muted">
      Every Search Console property you can reach is already connected. Add one in
      <a class="underline" href="https://search.google.com/search-console" target="_blank" rel="noopener">Google Search Console</a>,
      then reload this step.
    </p>
  </div>
</template>

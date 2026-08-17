<script lang="ts" setup>
import type { SitePreview } from '~~/layers/core/app/types'

definePageMeta({
  layout: 'dashboard',
  title: 'Settings',
  icon: 'i-heroicons-cog-6-tooth',
  description: 'Manage your team settings.',
})

// `$fetch` does not forward the session cookie during SSR, so the preview call
// answered 401 and threw the whole page to the error boundary. `useFetch` sends
// the incoming request headers, and a failure now stays inside the page.
const { data, status, error, refresh } = await useFetch('/api/sites/preview')

// `siteLabel()` falls back to the Search Console property when `domain` is null
// (sites imported from the old KV store), so `property` has to survive the map.
const sites = computed<(SitePreview & { property: string | null })[]>(() =>
  (data.value?.sites ?? []).map(site => ({
    ...site,
    domain: site.domain ?? '',
    startOfData: site.startOfData ?? '',
    sitemaps: (site.sitemaps ?? []) as SitePreview['sitemaps'],
  })),
)
const selectedSites = ref<string[]>([])
</script>

<template>
  <div class="max-w-5xl space-y-6">
    <div v-if="status === 'pending'" class="flex min-h-40 items-center justify-center" aria-live="polite">
      <UIcon name="i-heroicons-arrow-path" class="size-6 animate-spin text-muted" />
      <span class="sr-only">Loading team settings</span>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      title="Team settings could not load"
      :description="error.statusCode === 401
        ? 'Your session has expired. Sign in again to manage this team.'
        : 'Your Search Console properties are unavailable right now. Try again in a moment.'"
    >
      <template #actions>
        <UButton
          v-if="error.statusCode === 401"
          to="/login"
          color="neutral"
          variant="outline"
          size="sm"
          label="Sign in"
        />
        <UButton v-else color="neutral" variant="outline" size="sm" label="Retry" @click="refresh()" />
      </template>
    </UAlert>

    <template v-else>
      <TeamSiteSelector v-model="selectedSites" :sites="sites" />
      <p class="text-sm text-muted">
        To change which sites this team tracks, go to
        <NuxtLink to="/dashboard/team/sites" class="text-primary underline">
          Sites
        </NuxtLink>.
      </p>
    </template>
  </div>
</template>

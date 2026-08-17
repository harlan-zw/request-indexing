<script lang="ts" setup>
import type { SitesPreview } from '~~/layers/core/app/types'

definePageMeta({
  layout: 'dashboard',
  title: 'Settings',
  // Not the members glyph: Sites, Members and Settings all used to share it.
  icon: 'i-heroicons-cog-6-tooth',
  description: 'Manage your team settings.',
})

const onSessionExpired = createSessionExpiredHandler()

// Top-level await, so an unhandled 401 here failed the whole page and reported
// as an error. An expired cookie ends at login instead.
const preview = await readSessionScoped(() => $fetch<{ sites: SitesPreview }>('/api/sites/preview'))
if (preview._tag === 'SessionExpired')
  await onSessionExpired()

const sites = computed<SitesPreview>(() => preview._tag === 'Ready' ? preview.value.sites : [])
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <!-- A read-only summary, not a picker. This used to render the full
         `TeamSiteSelector` bound to a ref that was never seeded and never
         saved: the counter read 0/3 for a team with sites, ticking a box moved
         it, raised a limit toast, and persisted nothing. The copy below already
         sends the user to Sites to make the change. -->
    <div>
      <h2 class="mb-2 text-sm font-medium text-highlighted">
        Tracked sites
      </h2>
      <ul v-if="sites.length" class="divide-y divide-default rounded-md ring ring-default">
        <li v-for="site in sites" :key="site.siteId" class="flex items-center gap-2 px-3 py-2">
          <SiteFavicon :site="site" />
          <span class="truncate text-sm">{{ siteLabel(site) }}</span>
        </li>
      </ul>
      <p v-else class="text-sm text-muted">
        This team tracks no sites yet.
      </p>
    </div>
    <p class="text-sm text-muted">
      To change which sites this team tracks, go to
      <NuxtLink to="/dashboard/team/sites" class="text-primary underline">
        Sites
      </NuxtLink>.
    </p>
  </div>
</template>

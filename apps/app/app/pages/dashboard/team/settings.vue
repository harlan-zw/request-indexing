<script lang="ts" setup>
import type { SitesPreview } from '~~/layers/core/app/types'

definePageMeta({
  layout: 'dashboard',
  title: 'Settings',
  icon: 'i-heroicons-users',
  description: 'Manage your team settings.',
})

const onSessionExpired = createSessionExpiredHandler()

// Top-level await, so an unhandled 401 here failed the whole page and reported
// as an error. An expired cookie ends at login instead.
const preview = await readSessionScoped(() => $fetch<{ sites: SitesPreview }>('/api/sites/preview'))
if (preview._tag === 'SessionExpired')
  await onSessionExpired()

const sites = computed<SitesPreview>(() => preview._tag === 'Ready' ? preview.value.sites : [])
const selectedSites = ref<string[]>([])
</script>

<template>
  <div class="max-w-3xl">
    <TeamSiteSelector v-model="selectedSites" :sites="sites" />
  </div>
</template>

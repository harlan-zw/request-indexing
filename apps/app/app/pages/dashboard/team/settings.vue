<script lang="ts" setup>
import type { SitesPreview } from '~~/layers/core/app/types'

definePageMeta({
  layout: 'dashboard',
  title: 'Settings',
  icon: 'i-heroicons-users',
  description: 'Manage your team settings.',
})

const { sites } = await $fetch<{ sites: SitesPreview }>('/api/sites/preview')
const selectedSites = ref<string[]>([])
</script>

<template>
  <div class="max-w-3xl">
    <TeamSiteSelector v-model="selectedSites" :sites="sites" />
  </div>
</template>

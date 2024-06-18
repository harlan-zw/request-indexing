<script lang="ts" setup>
import {fetchSites} from "~/composables/fetch";

definePageMeta({
  layout: 'dashboard',
  title: 'Settings',
  icon: 'i-heroicons-users',
  description: 'Manage your team settings.',
})

const { data: siteData } = await fetchSites()

const value = ref([])
function syncSites(val) {
  value.value = val
}
</script>

<template>
  <div class="max-w-3xl">
    <TeamSiteSelector :sites="sites" :model-value="[]" @update:model-value="syncSites" />
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: 'dashboard',
  title: 'Settings',
  icon: 'i-heroicons-users',
  description: 'Manage your team settings.',
})

const { data: sites } = useFetch('/api/teams/sites', {
  transform(data) {
    return data.map(site => site.siteId)
  },
  default() {
    return []
  },
})
const value = ref([])
function syncSites(val) {
  value.value = val
}
</script>

<template>
  <div class="max-w-3xl">
    <TeamSiteSelector :model-value="sites" @update:model-value="syncSites" />
  </div>
</template>

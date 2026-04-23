<script lang="ts" setup>
const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Settings',
  subTitle: 'Data & Exports',
  icon: 'i-heroicons-check-circle',
})

const { data: connectedSites } = useGscdumpConnectedSites()

const siteSync = computed(() => {
  if (!connectedSites.value?.sites)
    return null
  return connectedSites.value.sites.find(s => s.siteId === props.site.gscdumpSiteId)
})
</script>

<template>
  <div>
    <div class="flex gap-3 mb-3">
      <h2 class="mb-2 flex items-center text-sm font-semibold">
        Property {{ site.property }}
      </h2>
    </div>
    <div class="grid grid-cols-3 w-full gap-10 mb-10">
      <UCard>
        <h2 class="mb-3 flex items-center text-lg font-semibold gap-1">
          <UIcon name="i-ph-database-duotone" class="w-5 h-5 text-gray-500" />
          <span>Sync Status</span>
        </h2>
        <div v-if="siteSync" class="text-sm space-y-3">
          <div class="flex items-center gap-2">
            <UBadge
              :color="siteSync.syncStatus === 'synced' ? 'green' : siteSync.syncStatus === 'syncing' ? 'blue' : 'yellow'"
              variant="subtle"
            >
              {{ siteSync.syncStatus }}
            </UBadge>
          </div>
          <div v-if="siteSync.syncProgress" class="space-y-1">
            <div class="text-3xl font-bold">
              {{ siteSync.syncProgress.percent }}%
            </div>
            <UProgress :value="siteSync.syncProgress.percent" color="blue" class="mt-1" />
            <div class="text-xs text-gray-500">
              {{ siteSync.syncProgress.completed }} / {{ siteSync.syncProgress.total }} days synced
            </div>
          </div>
          <div v-if="siteSync.newestDateSynced" class="text-xs text-gray-500">
            Newest: {{ siteSync.newestDateSynced }}
          </div>
          <div v-if="siteSync.oldestDateSynced" class="text-xs text-gray-500">
            Oldest: {{ siteSync.oldestDateSynced }}
          </div>
        </div>
        <div v-else class="text-sm text-gray-500">
          Loading sync status...
        </div>
      </UCard>
      <UCard>
        <h2 class="mb-3 flex items-center text-lg font-semibold gap-1">
          <UIcon name="i-ph-file-archive-duotone" class="w-5 h-5 text-gray-500" />
          <span>Data Archive</span>
        </h2>
        <div class="text-gray-500 text-sm mb-4">
          Google Search Console deletes your site data after 16 months. Your data is archived and preserved through gscdump.
        </div>
        <div v-if="siteSync" class="text-sm">
          <div v-if="siteSync.newestDateSynced && siteSync.oldestDateSynced" class="text-3xl font-bold mb-2">
            {{ Math.round((new Date(siteSync.newestDateSynced).getTime() - new Date(siteSync.oldestDateSynced).getTime()) / (1000 * 60 * 60 * 24)) }} days
            <span class="text-sm font-normal text-gray-500">of data</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

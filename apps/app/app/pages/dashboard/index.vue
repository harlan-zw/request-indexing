<script lang="ts" setup>
import { useJobListener } from '~~/layers/core/app/composables/events'
import { fetchSites } from '~~/layers/core/app/composables/fetch'

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
  icon: 'i-ph-app-window-duotone',
})

const { data, refresh } = await fetchSites()
const key = ref(0)
const sites = computed(() => (data.value?.sites || []))

useJobListener('sites/sync-finished', async () => {
  await refresh()
  key.value++
})
</script>

<template>
  <div :key="key" class="space-y-6">
    <div class="flex items-center gap-3">
      <CalenderFilter />
    </div>
    <ConnectSearchConsoleCard />

    <div class="space-y-7">
      <CardSite v-for="site in sites" :key="site.siteId" :site="site" />
    </div>
  </div>
</template>

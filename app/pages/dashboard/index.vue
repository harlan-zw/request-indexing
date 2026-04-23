<script lang="ts" setup>
import { useJobListener } from '~/composables/events'
import { fetchSites } from '~/composables/fetch'

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboard',
  icon: 'i-ph-app-window-duotone',
})

const { data, refresh } = await fetchSites()
const key = ref(0)
const sites = computed(() => (data.value?.sites || []))

useJobListener('sites/syncFinished', async () => {
  await refresh()
  key.value++
})
</script>

<template>
  <div :key="key" class="space-y-7">
    <div class="flex items-center gap-3">
      <div class="border border-dashed rounded-lg">
        <CalenderFilter />
      </div>
    </div>
    <div class="space-y-10">
      <CardSite v-for="site in sites" :key="site.siteId" :site="site" />
    </div>
  </div>
</template>

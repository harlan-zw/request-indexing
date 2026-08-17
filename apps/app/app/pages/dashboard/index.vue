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

const { period } = useDashboardPeriod()

// Every card reads the same period, so the applied range is stated once here.
// Client-only: the boundary dates depend on "today" in the reader's timezone.
const appliedRange = computed(() => {
  const days = periodToDays(period.value)
  const iso = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() - offset)
    return d.toISOString().slice(0, 10)
  }
  return `${iso(days)} to ${iso(1)}`
})

useJobListener('sites/sync-finished', async () => {
  await refresh()
  key.value++
})

// One control for the whole page: remounting the cards restarts every per-site
// fetch, so a single failing round trip does not need five separate retries.
const isRefreshing = ref(false)
async function refreshAll() {
  isRefreshing.value = true
  await refresh()
  key.value++
  isRefreshing.value = false
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="flex flex-col gap-1">
        <span class="text-xs font-medium uppercase tracking-wider text-muted">
          Date range
        </span>
        <div role="group" aria-label="Date range" class="flex items-center gap-2">
          <CalenderFilter />
          <ClientOnly>
            <span class="text-xs text-muted tabular-nums">{{ appliedRange }}</span>
          </ClientOnly>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="outline"
          size="sm"
          class="min-h-10"
          :loading="isRefreshing"
          label="Refresh all"
          @click="refreshAll"
        />
        <UButton
          to="/dashboard/team/sites"
          icon="i-heroicons-plus"
          size="sm"
          class="min-h-10"
          label="Add site"
        />
      </div>
    </div>

    <ConnectSearchConsoleCard />

    <div v-if="sites.length" :key="key" class="space-y-7">
      <CardSite v-for="site in sites" :key="site.siteId" :site="site" />
    </div>
    <div v-else class="rounded-lg border border-default py-12 text-center">
      <p class="font-medium text-highlighted">
        No sites connected yet
      </p>
      <p class="mt-1 text-sm text-muted">
        Connect a Search Console property to see its performance here.
      </p>
      <UButton to="/dashboard/team/sites" class="mt-4 min-h-11" label="Add a site" />
    </div>
  </div>
</template>

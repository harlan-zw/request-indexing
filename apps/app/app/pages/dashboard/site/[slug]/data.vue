<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  // DE1: the page has no download, no CSV and no API link, so it is not
  // "Data & Exports". It reports what has been synced and how far back the
  // archive goes. DE7: the check-circle belonged to Web Indexing.
  title: 'Data Archive',
  icon: 'i-ph-archive-duotone',
})

const { data: connectedSites, status } = useGscdumpConnectedSites()

const siteSync = computed(() => {
  if (!connectedSites.value?.sites)
    return null
  return connectedSites.value.sites.find(s => s.siteId === site.gscdumpSiteId) ?? null
})

// DE3: "244 / 244 days synced" and "686 days of data" are two different
// things. One is progress through the window Search Console will still serve,
// the other is the span this archive holds. Report each with its own label.
const archivedDays = computed(() => {
  const sync = siteSync.value
  if (!sync?.newestDateSynced || !sync?.oldestDateSynced)
    return null
  const span = new Date(sync.newestDateSynced).getTime() - new Date(sync.oldestDateSynced).getTime()
  return Math.max(1, Math.round(span / 86_400_000))
})

const syncStatusColor = computed(() => {
  switch (siteSync.value?.syncStatus) {
    case 'synced': return 'success' as const
    case 'syncing': return 'info' as const
    default: return 'warning' as const
  }
})
</script>

<template>
  <div class="space-y-7">
    <div>
      <!-- DE4: a raw Search Console property string is an identifier, not a
           heading. -->
      <h2 class="text-sm font-semibold">
        {{ siteLabel(site) }}
      </h2>
      <p class="text-xs text-muted">
        Search Console property {{ site.property }}
      </p>
    </div>

    <div v-if="status === 'pending'" class="flex items-center justify-center py-8" aria-live="polite">
      <UIcon name="i-heroicons-arrow-path" class="size-5 animate-spin text-muted" />
      <span class="sr-only">Loading sync status</span>
    </div>
    <UCard v-else-if="!siteSync">
      <div class="py-4 text-sm text-muted">
        This site is not synced with Search Console yet, so there is nothing archived.
      </div>
    </UCard>
    <div v-else-if="siteSync" class="grid grid-cols-1 gap-7 lg:grid-cols-2">
      <UCard>
        <h2 class="mb-3 flex items-center gap-1 text-lg font-semibold">
          <UIcon name="i-ph-arrows-clockwise-duotone" class="w-5 h-5 text-gray-500" />
          <span>Sync</span>
        </h2>
        <div class="space-y-3 text-sm">
          <UBadge :color="syncStatusColor" variant="subtle">
            {{ siteSync.syncStatus }}
          </UBadge>
          <div v-if="siteSync.syncProgress" class="space-y-1">
            <div class="text-3xl font-bold">
              {{ siteSync.syncProgress.percent }}%
            </div>
            <!-- DE5: blue was the one off-palette element on the page. -->
            <UProgress :value="siteSync.syncProgress.percent" color="primary" class="mt-1" />
            <div class="text-xs text-muted">
              {{ siteSync.syncProgress.completed }} of {{ siteSync.syncProgress.total }} days fetched from Search Console
            </div>
          </div>
          <!-- DE6: one date format on this page, matching the relative times
               used on Sitemaps. -->
          <div v-if="siteSync.lastSyncAt" class="text-xs text-muted">
            Last run {{ formatIndexingTimeAgo(siteSync.lastSyncAt, true) }}
          </div>
        </div>
      </UCard>
      <UCard>
        <h2 class="mb-3 flex items-center gap-1 text-lg font-semibold">
          <UIcon name="i-ph-file-archive-duotone" class="w-5 h-5 text-gray-500" />
          <span>Archive</span>
        </h2>
        <!-- DE2: `gscdump` is an internal name and never belongs in user copy. -->
        <div class="mb-4 text-sm text-muted">
          Search Console drops your data after 16 months. Everything synced is kept here, including days Google no longer returns.
        </div>
        <div v-if="archivedDays" class="text-sm">
          <div class="mb-2 text-3xl font-bold">
            {{ archivedDays }} days
            <span class="text-sm font-normal text-muted">archived</span>
          </div>
          <div class="text-xs text-muted">
            Oldest day {{ formatIndexingTimeAgo(siteSync.oldestDateSynced!, true) }}, newest day {{ formatIndexingTimeAgo(siteSync.newestDateSynced!, true) }}.
          </div>
        </div>
        <div v-else class="text-sm text-muted">
          Nothing archived yet. The first sync is still running.
        </div>
      </UCard>
    </div>
  </div>
</template>

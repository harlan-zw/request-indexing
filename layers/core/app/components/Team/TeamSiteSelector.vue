<script setup lang="ts">
import type { SitePreview, SitesPreview } from '~~/layers/core/app/types'
import { useHumanFriendlyNumber } from '~~/layers/design-system/composables/formatting'

const props = withDefaults(defineProps<{
  sites: SitesPreview
  modelValue: string[]
  /**
   * Site limit for the team. The server owns this number and returns it from
   * `/api/sites/preview`; the hard-coded 3 here disagreed with the page copy
   * ("up to 6 sites") and with the counter.
   */
  max?: number
}>(), {
  max: 3,
})

const emits = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const data = ref<SitesPreview>(props.sites)
// const { user, fetch } = useUserSession()

// const isPending = computed(() => !props.sites.length)

const selected = ref<string[]>([...props.modelValue])
const maxSites = computed(() => props.max)

watch(selected, () => {
  emits('update:modelValue', selected.value)
})

const toast = useToast()
function select(row: SitePreview) {
  if (!selected.value.includes(row.siteId)) {
    if (selected.value.length < maxSites.value)
      selected.value.push(row.siteId)
    else
      toast.add({ title: `You can only select up to ${maxSites.value} sites.`, color: 'error' })
  }
  else {
    selected.value = selected.value.filter(s => s !== row.siteId)
  }
}

const sitePage = ref(1)
const pageCount = 6

const siteRows = computed<SitePreview[]>(() => {
  return (data.value || []).map((site) => {
    const sitemapWarningsCount = site.sitemaps?.reduce((acc, curr) => acc + (Number(curr.warnings) || 0), 0)
    const sitemapErrorsCount = site.sitemaps?.reduce((acc, curr) => acc + (Number(curr.errors) || 0), 0)
    return {
      ...site,
      sitemapWarningsCount,
      sitemapErrorsCount,
    }
  }).sort((a, b) => b.pageCount30Day - a.pageCount30Day)
})

const paginatedSites = computed<SitePreview[]>(() => {
  return siteRows.value.slice((sitePage.value - 1) * pageCount, (sitePage.value) * pageCount)
})

onMounted(() => {
  // watch(isPending, () => {
  //   if (!isPending.value && siteRows.value.length) {
  //     if (props.modelValue)
  //       selected.value = siteRows.value.filter(s => props.modelValue.includes(s.publicId))
  //     else
  //       selected.value = klona(siteRows.value).slice(0, Math.min(siteRows.value.length, maxSites))
  //   }
  // })
  if (!selected.value?.length)
    selected.value = siteRows.value.map(s => s.siteId).filter(id => props.modelValue.includes(id))
})

// const tableSelectedRows = computed(() => {
//   return selected.value.map(id => siteRows.value.find(s => s.siteId === id))
// })

const isSyncing = ref(false)
const nuxtApp = useNuxtApp()
const sideEffects: (() => void)[] = []
async function resync() {
  // we need to wait for the ws to update the sites
  interface SyncContext { syncedSites: number, createdSites: number }
  const hook = nuxtApp.hooks.hook as unknown as (name: 'app:users:syncGscSites', callback: (ctx: SyncContext) => void) => () => void
  sideEffects.push(hook('app:users:syncGscSites', (ctx) => {
    isSyncing.value = false
    toast.add({ title: 'Google Search Console Synced', description: `Found ${ctx.syncedSites} existing sites and ${ctx.createdSites} new sites.`, color: 'success' })
    sideEffects.forEach(fn => fn())
  }))
  isSyncing.value = true
  await $fetch('/api/user/sync-gsc')
}
onBeforeUnmount(() => {
  sideEffects.forEach(fn => fn())
})
</script>

<template>
  <div>
    <slot />
    <!-- The counter and the Resync action used to sit below the grid they
         describe, at opposite edges of the page. They lead the grid now. -->
    <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
      <div class="min-w-[200px]">
        <div class="text-sm text-muted">
          Selected Sites
        </div>
        <div class="text-lg font-bold tabular-nums text-highlighted">
          {{ selected.length }}/{{ maxSites }}
        </div>
        <UProgress :value="Math.min(selected.length / maxSites * 100, 100)" :color="selected.length < maxSites ? 'primary' : 'warning'" class="mt-1" />
        <p class="mt-1 text-xs text-muted">
          <UIcon name="i-heroicons-information-circle" class="size-4 -mb-1" />
          You can select up to {{ maxSites }} sites.
        </p>
      </div>
      <div class="max-w-[240px]">
        <UButton :loading="isSyncing" type="button" class="mb-1 min-h-10" icon="i-heroicons-arrow-path" @click="resync">
          Resync
        </UButton>
        <div class="text-xs text-muted">
          Made changes to Google Search Console? Resync your data.
        </div>
      </div>
    </div>

    <div v-if="siteRows.length" class="mb-5">
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <UButton
          v-for="(site, key) in paginatedSites"
          :key="key"
          variant="ghost"
          color="neutral"
          class="flex items-center gap-2 text-left"
          :class="selected.some(s => s === site.siteId) ? 'bg-primary/10' : 'opacity-80'"
          @click="select(site)"
        >
          <UCheckbox color="primary" :model-value="selected.some(s => s === site.siteId)" @update:model-value="select(site)" />
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <SiteFavicon :site="site" />
              <div class="truncate font-bold text-highlighted">
                {{ siteLabel(site) }}
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-muted">
              <div>
                {{ (site.domain || '').startsWith('sc-domain:') ? 'Domain' : 'URL' }} Property
              </div>
              <UiTooltip v-if="!site.pageCount30Day" text="Page count is still syncing from Google Search Console">
                <span class="flex items-center gap-1">
                  <UIcon name="i-ph-arrows-clockwise-duotone" class="size-4 animate-spin" />
                  <span>Syncing</span>
                </span>
              </UiTooltip>
              <div v-else>
                {{ useHumanFriendlyNumber(site.pageCount30Day) }} {{ site.pageCount30Day === 1 ? 'Page' : 'Pages' }}
              </div>
            </div>
          </div>
        </UButton>
      </div>
      <div v-if="siteRows.length > pageCount" class="mt-7 flex items-center justify-between border-t border-default px-3 py-5">
        <UPagination v-model:page="sitePage" :items-per-page="pageCount" :total="siteRows.length" :show-edges="false" />
        <div class="text-base text-muted tabular-nums">
          {{ siteRows.length }} total
        </div>
      </div>
    </div>
  </div>
</template>

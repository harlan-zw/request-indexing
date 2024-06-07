<script setup lang="ts">
import { useFriendlySiteUrl, useHumanFriendlyNumber } from '~/composables/formatting'
import type { SiteSelect } from '~/server/database/schema'
import type { SitesPreview } from '~/types'

const props = defineProps<{
  sites: SitesPreview
  modelValue: string[]
}>()

const emits = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const data = ref<SitesPreview>(props.sites)
// const { user, fetch } = useUserSession()

// const isPending = computed(() => !props.sites.length)

const selected = ref<SiteSelect[]>(props.modelValue)
const maxSites = 3

watch(selected, () => {
  emits('update:modelValue', selected.value)
})

const toast = useToast()
function select(row: SiteSelect) {
  if (!selected.value.includes(row.siteId)) {
    if (selected.value.length < maxSites)
      selected.value.push(row.siteId)
    else
      toast.add({ title: `You can only select up to ${maxSites} sites.`, color: 'red' })
  }
  else {
    selected.value = selected.value.filter(s => s !== row.siteId)
  }
}

const sitePage = ref(1)
const pageCount = 6

const siteRows = computed<SiteSelect[]>(() => {
  return (data.value || []).map((site) => {
    const sitemapWarningsCount = site.sitemaps?.reduce((acc, curr) => acc + (Number.parseInt(curr.warnings) || 0), 0)
    const sitemapErrorsCount = site.sitemaps?.reduce((acc, curr) => acc + (Number.parseInt(curr.errors) || 0), 0)
    return {
      ...site,
      sitemapWarningsCount,
      sitemapErrorsCount,
    }
  })
    .sort((a, b) => b.pageCount30Day - a.pageCount30Day)
})

const paginatedSites = computed<SiteSelect[]>(() => {
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
    selected.value = siteRows.value.filter(s => props.modelValue.includes(s.siteId))
})

// const tableSelectedRows = computed(() => {
//   return selected.value.map(id => siteRows.value.find(s => s.siteId === id))
// })

const isSyncing = ref(false)
const nuxtApp = useNuxtApp()
const sideEffects: (() => void)[] = []
async function resync() {
  // we need to wait for the ws to update the sites
  sideEffects.push(nuxtApp.hooks.hook('app:users:syncGscSites', (ctx) => {
    isSyncing.value = false
    toast.add({ title: 'Google Search Console Synced', description: `Found ${ctx.syncedSites} existing sites and ${ctx.createdSites} new sites.`, color: 'green' })
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
    <div v-if="siteRows.length">
      <slot />
      <div class="mb-5">
        <div class="grid grid-cols-2 max-w-xl mx-auto gap-3">
          <UButton v-for="(site, key) in paginatedSites" :key="key" variant="ghost" color="gray" class="flex items-center gap-2" :class="selected.some(s => s === site.siteId) ? 'bg-blue-50' : 'opacity-80'" @click="select(site)">
            <UCheckbox color="blue" :model-value="selected.some(s => s === site.siteId)" @update:model-value="select(site)" />
            <div>
              <div class="flex items-center gap-2 mb-1">
                <SiteFavicon :site="site" />
                <div class="font-bold text-gray-800 dark:text-gray-100">
                  {{ useFriendlySiteUrl(site.domain || site.property) }}
                </div>
              </div>
              <div class="flex gap-2 text-xs">
                <div>
                  {{ site.property.startsWith('sc-domain:') ? 'Domain' : 'URL' }} Property
                </div>
                <div v-if="!site.pageCount30Day">
                  <UIcon name="i-ph-arrows-clockwise-duotone" class="w-4 h-4 animate-spin" />
                </div>
                <div v-else>
                  {{ useHumanFriendlyNumber(site.pageCount30Day) }} Pages
                </div>
              </div>
            </div>
          </UButton>
        </div>
        <div v-if="siteRows.length > pageCount" class="flex items-center justify-between mt-7 px-3 py-5 border-t  border-gray-200 dark:border-gray-700">
          <UPagination v-model="sitePage" :page-count="pageCount" :total="siteRows.length" />
          <div class="text-base dark:text-gray-300 text-gray-600 mb-2">
            {{ siteRows.length }} total
          </div>
        </div>
      </div>
    </div>
    <div>
      <div class="mb-5 flex flex-col md:flex-row md:justify-around md:items-center gap-7">
        <div class="flex justify-around items-center gap-7">
          <div class="w-2xl">
            <div>
              <div class="text-sm">
                Selected Sites
              </div>
              <div class="text-lg font-bold">
                {{ selected.length }}/{{ maxSites }}
              </div>
              <UProgress :value="selected.length / maxSites * 100" :color="selected.length < maxSites ? 'purple' : 'red'" class="mt-1" />
            </div>
          </div>
          <div class="max-w-[200px] text-gray-500 dark:text-gray-400 text-sm">
            <UIcon name="i-heroicons-information-circle" class="w-4 h-4 -mb-1" />
            You can upgrade your account later to support more sites.
          </div>
        </div>
        <div class="max-w-[200px]">
          <UButton :loading="isSyncing" type="button" class="mb-1" icon="i-heroicons-arrow-path" @click="resync">
            Resync
          </UButton>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            Made changes to Google Search Console? Resync your data.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

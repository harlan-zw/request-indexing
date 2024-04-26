<script setup lang="ts">
import { klona } from 'klona'
import { parseURL, withoutTrailingSlash } from 'ufo'
import { useFriendlySiteUrl, useHumanFriendlyNumber } from '~/composables/formatting'
import type { SiteSelect } from '~/server/database/schema'

const props = defineProps<{
  modelValue: string[]
}>()

const emits = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const data = ref([])
const pending = ref(true)
async function refresh() {
  // TODO avoid duplicate fetches
  data.value = await $fetch('/api/sites/preview', {
    // query: {
    //   force: 'true',
    // },
  })
    .finally(() => {
      pending.value = false
    })
}

const { user, fetch } = useUserSession()

const isPending = computed(() => pending.value || data.value?.isPending)

const selected = ref<SiteSelect[]>([])
const maxSites = 6

watch(selected, () => {
  emits('update:modelValue', selected.value.map(s => s.publicId))
})

const toast = useToast()
function select(row: SiteSelect) {
  const _selected = klona(selected.value)
  const index = selected.value.findIndex(item => item.siteId === row.siteId)
  if (index === -1 && selected.value.length < maxSites) {
    selected.value = [...selected.value, row]
  }
  else if (index !== -1) {
    _selected.splice(index, 1)
    selected.value = _selected
  }
  else { toast.add({ title: `You can only select up to ${maxSites} sites.`, color: 'red' }) }
}

const sitePage = ref(1)
const pageCount = 6

const siteRows = computed<SiteSelect[]>(() => {
  if (!data.value)
    return []
  return (data.value.distinctOrigins || []).map((site) => {
    const property = data.value.sites.find(s => s.siteId === site.siteId)
    const analytics = data.value.analytics.find(s => s.siteId === site.siteId)
    const sitemapWarningsCount = site.sitemaps?.reduce((acc, curr) => acc + (Number.parseInt(curr.warnings) || 0), 0)
    const sitemapErrorsCount = site.sitemaps?.reduce((acc, curr) => acc + (Number.parseInt(curr.errors) || 0), 0)

    return {
      ...property,
      ...site,
      ...analytics,
      domain: property.domain || withoutTrailingSlash(property.property),
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
  refresh()

  watch(isPending, () => {
    if (!isPending.value && siteRows.value.length) {
      if (props.modelValue)
        selected.value = siteRows.value.filter(s => props.modelValue.includes(s.publicId))
      else
        selected.value = klona(siteRows.value).slice(0, Math.min(siteRows.value.length, maxSites))
    }
  })
  watch(() => props.modelValue, (val) => {
    selected.value = siteRows.value.filter(s => val.includes(s.publicId))
  })
})
</script>

<template>
  <div>
    <div v-if="siteRows.length">
      <h3 class="text-lg mb-3 font-bold flex items-center gap-2">
        Site Properties
      </h3>
      <p class="dark:text-gray-400 text-gray-600 text-sm mb-5">
        These properties come from your Google Search Console account. If you don't see your site, please
        check it exists within <a class="underline" href="https://search.google.com/search-console" target="_blank">Google Search Console</a>.
      </p>
      <div class="mb-5">
        <UTable
          v-model="selected" :rows="paginatedSites" :columns="[
            { key: 'property', label: 'Property', sortable: true },
            { key: 'type', label: 'Property Type' },
            { key: 'pages', label: 'Pages' },
          ]" @select="select"
        >
          <template #pages-data="{ row: site }">
            <div class="text-right">
              {{ useHumanFriendlyNumber(site.pageCount30Day) }}
            </div>
          </template>
          <template #type-data="{ row: site }">
            <div class="flex items-center gap-2">
              <UTooltip v-if="site.userSites[0]?.permissionLevel !== 'siteOwner'" :text="`You have limited capabilities to this property as a '${site.userSites[0]?.permissionLevel}'.`">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500" />
              </UTooltip>
              <UTooltip v-else text="You have full permissions to this property.">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
              </UTooltip>
              <div class="font-semibold">
                {{ site.property.startsWith('sc-domain:') ? 'Domain' : 'URL' }}
              </div>
            </div>
          </template>
          <template #property-data="{ row: site }">
            <div class="flex items-center gap-3 text-lg" :class="selected.some(s => s.domain === site.domain) ? '' : 'opacity-70'">
              <img :src="`https://www.google.com/s2/favicons?domain=${site.domain || site.property.replace('sc-domain:', 'https://')}`" alt="favicon" class="w-4 h-4">
              <div>
                <div class="font-bold text-gray-800 dark:text-gray-100">
                  {{ useFriendlySiteUrl(site.domain || site.property) }}
                </div>
              </div>
            </div>
            <div v-if="!site.sitemaps.length" class="flex items-center gap-1 mt-2">
              <UTooltip text="no sitemap">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4 text-yellow-500" />
              </UTooltip>
              <span>Sitemap has not be submitted.</span>
            </div>
            <div v-else-if="site.sitemaps[0] && site.sitemapWarningsCount > 0" class="flex items-center gap-1 mt-2">
              <UTooltip text="no sitemap">
                <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500" />
              </UTooltip>
              <a :href="site.sitemaps[0].path" target="_blank" class="underline">{{ parseURL(site.sitemaps[0].path).pathname }}</a> Has Warnings
            </div>
          </template>
        </UTable>
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
          <UButton class="mb-1" icon="i-heroicons-arrow-path" @click="sync">
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

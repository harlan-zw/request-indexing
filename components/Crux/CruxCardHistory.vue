<script lang="ts" setup>
import { useFriendlySiteUrl } from '~/composables/formatting'
import type { GoogleSearchConsoleSite, SiteExpanded } from '~/types'
import { useSiteData } from '~/composables/fetch'

const props = defineProps<{
  site: GoogleSearchConsoleSite
  mockData?: SiteExpanded
}>()

const { site } = toRefs(props)

const { session } = useUserSession()

const siteId = computed(() => site.value.domain)

const siteData = useSiteData(site.value)
const { data: crux } = siteData.crux()

const link = computed(() => `/dashboard/site/${encodeURIComponent(siteId.value)}/overview`)

function refresh() {
  // callFnSyncToggleRef(forceRefresh, isForceRefreshing)
}

async function hide() {
  const sites = new Set([...session.value.user.selectedSites])
  sites.delete(site.value.domain)
  // save it upstream
  session.value = await $fetch('/api/user/me', {
    method: 'POST',
    body: JSON.stringify({ selectedSites: [...sites] }),
  })
}
</script>

<template>
  <UCard class="min-h-[270px] flex flex-col" :ui="{ body: { base: 'flex-grow flex items-center', padding: 'px-0 py-0 sm:p-0' }, header: { padding: 'px-2 py-3 sm:px-3' }, footer: { padding: 'px-2 py-3 sm:px-3' } }">
    <template #header>
      <div class="flex justify-between">
        <NuxtLink :to="link" class="flex items-center gap-2">
          <SiteFavicon :site="site" />
          <div>
            <h3 class="font-bold">
              {{ useFriendlySiteUrl(siteId) }}
            </h3>
          </div>
        </NuxtLink>
        <UDropdown :class="mockData ? 'pointer-events-none' : ''" :items="[[{ label: 'View', icon: 'i-heroicons-eye', click: () => link && navigateTo(link) }, { label: 'Reload', icon: 'i-heroicons-arrow-path', click: refresh }, { label: 'Hide', icon: 'i-heroicons-trash', click: hide }]]" :popper="{ offsetDistance: 0, placement: 'right-start' }">
          <UButton color="white" label="" variant="ghost" trailing-icon="i-heroicons-chevron-down" />
        </UDropdown>
      </div>
    </template>
    <div v-if="crux?.exists === false" class="w-full">
      <div class="text-gray-500 text-center w-full text-sm">
        No data from Chrome UX report
      </div>
    </div>
    <div v-else class="w-full flex-col flex ">
      <div v-if="crux?.inp?.length" class="w-full relative">
        <div>INP</div>
        <CruxGraphInp v-if="crux?.inp" :value="crux.inp" />
      </div>
      <div v-if="crux?.cls?.length" class="w-full relative">
        <div>CLS</div>
        <CruxGraphCls v-if="crux?.cls" :value="crux.cls" />
      </div>
      <div v-if="crux?.lcp?.length" class="w-full relative">
        <div>LCP</div>
        <CruxGraphLcp v-if="crux?.lcp" :value="crux.lcp" />
      </div>
    </div>
  </UCard>
</template>

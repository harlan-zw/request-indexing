<script lang="ts" setup>
import type { Ref } from 'vue'
import { toRef } from 'vue'
import { useFriendlySiteUrl } from '~/composables/formatting'
import type { GoogleSearchConsoleSite, SiteExpanded } from '~/types'
import { fetchSite } from '~/composables/fetch'

const props = defineProps<{
  site: GoogleSearchConsoleSite
  mockData?: SiteExpanded
}>()

const { site } = toRefs(props)

const { session, user } = useUserSession()

const { data: _data, pending: _pending, forceRefresh, error } = await fetchSite(site.value, !!props.mockData)

const isForceRefreshing = ref(false)
const pending = computed(() => {
  if (props.mockData)
    return false
  return toValue(_pending) || toValue(isForceRefreshing)
})
const data = toRef(props.mockData || _data) as Ref<SiteExpanded | null>

const siteUrlFriendly = computed(() => {
  return useFriendlySiteUrl(site.value.siteUrl)
})
const link = computed(() => `/dashboard/site/${encodeURIComponent(site.value.siteUrl)}`)

function refresh() {
  callFnSyncToggleRef(forceRefresh, isForceRefreshing)
}

async function hide() {
  const sites = new Set([...(session.value.hiddenSites || []), props.site.siteUrl])
  // save it upstream
  session.value = await $fetch('/api/user/me', {
    method: 'POST',
    body: JSON.stringify({ hiddenSites: [...sites] }),
  })
}
</script>

<template>
  <UCard class="min-h-[270px] flex flex-col" :ui="{ body: { base: 'flex-grow flex items-center', padding: ' px-0 py-0 sm:p-0' } }">
    <template #header>
      <div class="flex justify-between">
        <NuxtLink :to="link" class="flex items-center gap-2">
          <img :src="`https://www.google.com/s2/favicons?domain=${site.siteUrl.replace('sc-domain:', 'https://')}`" alt="favicon" class="w-4 h-4">
          <h3 class="font-bold">
            {{ siteUrlFriendly }}
          </h3>
        </NuxtLink>
        <UDropdown :class="mockData ? 'pointer-events-none' : ''" :items="[[{ label: 'View', icon: 'i-heroicons-eye', click: () => link && navigateTo(link) }, { label: 'Reload', icon: 'i-heroicons-arrow-path', click: refresh }, { label: 'Hide', icon: 'i-heroicons-trash', click: hide }]]" :popper="{ offsetDistance: 0, placement: 'right-start' }">
          <UButton color="white" label="" variant="ghost" trailing-icon="i-heroicons-chevron-down" />
        </UDropdown>
      </div>
    </template>
    <div class="flex-grow w-full h-full">
      <div v-if="pending" class="w-full h-full flex items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin w-12 h-12" />
      </div>
      <div v-else-if="error" class="w-full h-full flex items-center justify-center">
        <div>
          <div class="mb-3">
            <div class="text-lg font-semibold">
              <UIcon name="i-heroicons-exclamation-triangle" class="w-4 h-4" /> Failed to refresh
            </div>
            <div class="opacity-80 text-sm">
              {{ error.statusMessage }}
            </div>
          </div>
          <UButton size="xs" color="gray" @click="refresh">
            Refresh
          </UButton>
        </div>
      </div>
      <div v-else-if="data" class="relative w-full h-full">
        <div class="flex px-5 pt-2 items-start justify-start gap-4">
          <div class="flex items-center justify-center gap-2">
            <div class="flex items-center flex-col justify-center">
              <div class="text-2xl font-semibold">
                <template v-if="data.nonIndexedPercent && data.nonIndexedPercent !== -1">
                  {{ Math.round(data.nonIndexedPercent * 100) }}<span class="text-xl">%</span>
                </template>
                <template v-else>
                  ?
                </template>
              </div>
              <div class="opacity-80 text-sm">
                Indexed
              </div>
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1">
            <div class="flex items-center justify-center gap-2">
              <TrendPercentage :value="data.analytics.period.totalClicks" :prev-value="data.analytics.prevPeriod.totalClicks" />
              <UTooltip :text="`Clicks last ${user.analyticsPeriod}`" class="flex items-end gap-2">
                <span>{{ useHumanFriendlyNumber(data!.analytics.period.totalClicks) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" class="w-5 h-5 text-blue-300"><path fill="currentColor" d="m11.5 11l6.38 5.37l-.88.18l-.64.12c-.63.13-.99.83-.71 1.4l.27.58l1.36 2.94l-1.42.66l-1.36-2.93l-.26-.58a.985.985 0 0 0-1.52-.36l-.51.4l-.71.57zm-.74-2.31a.76.76 0 0 0-.76.76V20.9c0 .42.34.76.76.76c.19 0 .35-.06.48-.16l1.91-1.55l1.66 3.62c.13.27.4.43.69.43c.11 0 .22 0 .33-.08l2.76-1.28c.38-.18.56-.64.36-1.01L17.28 18l2.41-.45a.88.88 0 0 0 .43-.26c.27-.32.23-.79-.12-1.08l-8.74-7.35l-.01.01a.756.756 0 0 0-.49-.18M15 10V8h5v2zm-1.17-5.24l2.83-2.83l1.41 1.41l-2.83 2.83zM10 0h2v5h-2zM3.93 14.66l2.83-2.83l1.41 1.41l-2.83 2.83zm0-11.32l1.41-1.41l2.83 2.83l-1.41 1.41zM7 10H2V8h5z" /></svg>
              </UTooltip>
            </div>
            <div class="flex items-center justify-center gap-2">
              <TrendPercentage :value="data.analytics.period.totalImpressions" :prev-value="data.analytics.prevPeriod.totalImpressions" />
              <UTooltip :text="`Impressions last ${user.analyticsPeriod}`" class="flex items-end gap-2">
                <span>{{ useHumanFriendlyNumber(data!.analytics.period.totalImpressions) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="0" height="24" viewBox="0 0 32 32" class="w-5 h-5 text-purple-300"><path fill="currentColor" d="M30.94 15.66A16.69 16.69 0 0 0 16 5A16.69 16.69 0 0 0 1.06 15.66a1 1 0 0 0 0 .68A16.69 16.69 0 0 0 16 27a16.69 16.69 0 0 0 14.94-10.66a1 1 0 0 0 0-.68ZM16 25c-5.3 0-10.9-3.93-12.93-9C5.1 10.93 10.7 7 16 7s10.9 3.93 12.93 9C26.9 21.07 21.3 25 16 25Z" /><path fill="currentColor" d="M16 10a6 6 0 1 0 6 6a6 6 0 0 0-6-6Zm0 10a4 4 0 1 1 4-4a4 4 0 0 1-4 4Z" /></svg>
              </UTooltip>
            </div>
          </div>
        </div>
        <div class="h-[100px] max-w-full overflow-hidden">
          <GraphClicks v-if="!pending && data.graph" :value="data.graph.map(g => ({ time: g.time, value: g.clicks }))" :value2="data.graph.map(g => ({ time: g.time, value: g.impressions }))" />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex items-center justify-between">
        <div class="flex gap-2 items-center ">
          <UButton :class="mockData ? 'pointer-events-none' : ''" :disabled="pending" variant="ghost" color="gray" :to="link">
            View
          </UButton>
        </div>

        <div class="flex items-center gap-2">
          <div class="opacity-60 text-xs">
            <template v-if="site.siteUrl.includes('sc-domain:')">
              Domain Property
            </template>
            <template v-else>
              Site Property
            </template>
          </div>
          <UTooltip v-if="!mockData && site.permissionLevel !== 'siteOwner'" :text="`'${site.permissionLevel}' is unable to submit URLs for indexing`">
            <UIcon name="i-heroicons-exclamation-triangle" class="w-5 h-5 text-yellow-500" />
          </UTooltip>
          <UTooltip v-else text="You can submit URLs for indexing for this site.">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500" />
          </UTooltip>
        </div>
      </div>
    </template>
  </UCard>
</template>

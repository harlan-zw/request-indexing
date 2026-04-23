<script setup lang="ts">
import type { SiteSelect } from '#shared/types/database'
import { useFriendlySiteUrl } from '~/composables/formatting'

const props = defineProps<{
  site: SiteSelect
}>()

const emits = defineEmits<{
  hide: []
}>()

const { period: dashboardPeriod } = useDashboardPeriod()

const { data, status } = useGscdumpDates(
  () => props.site.gscdumpSiteId,
  dashboardPeriod,
)

function hide() {
  emits('hide')
}
</script>

<template>
  <div>
    <CardTitle>
      <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/overview`" class="text-sm flex items-center gap-1">
        <SiteFavicon :site="site" />
        <div>
          <h2 class="font-bold">
            {{ useFriendlySiteUrl(site.domain) }}
          </h2>
        </div>
      </NuxtLink>
    </CardTitle>
    <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
      <div class="flex gap-5 items-center">
        <div v-if="status === 'pending'" class="h-full flex items-center justify-center w-full py-8">
          <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
        </div>
        <template v-else-if="data?.dates?.length">
          <GscdumpChart class="w-full flex-grow" :gscdump-site-id="site.gscdumpSiteId!" />
          <div class="flex items-start">
            <div class="px-5 w-[200px] items-start justify-center grid grid-cols-2 gap-3">
              <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/keywords`" class="transition group hover:bg-gray-50 rounded flex items-center">
                <div>
                  <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
                    Keywords
                  </div>
                  <div class="flex items-center gap-1">
                    <div class="text-xl font-semibold">
                      {{ useHumanFriendlyNumber(data.meta?.uniqueQueries ?? 0) }}
                    </div>
                  </div>
                </div>
              </NuxtLink>
              <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/pages`" class="transition group hover:bg-gray-50 rounded flex items-center">
                <div>
                  <div class="text-[11px] flex items-center gap-1 text-gray-500/80">
                    Pages
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-xl font-semibold">
                      {{ useHumanFriendlyNumber(data.meta?.uniquePages ?? 0) }}
                    </span>
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
        </template>
        <div v-else class="text-sm text-gray-500 py-4 w-full text-center">
          No data available for this period.
        </div>
      </div>
    </UCard>
  </div>
</template>

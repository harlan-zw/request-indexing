<script setup lang="ts">
import type { SiteSelect } from '#shared/types/database'

const props = defineProps<{
  site: SiteSelect
}>()

const { period: dashboardPeriod } = useDashboardPeriod()

const { data, status, error, refresh } = useGscdumpDates(
  () => props.site.gscdumpSiteId ?? undefined,
  dashboardPeriod,
)
const {
  data: summary,
  status: summaryStatus,
  error: summaryError,
  refresh: refreshSummary,
} = useGscdumpSiteSummary(
  () => props.site.gscdumpSiteId ?? undefined,
  dashboardPeriod,
)

// One state for the whole card. The two requests used to be read through
// separate `isPending` / `hasError` booleans, which let the card show an error
// box of one height and an empty sentence of another for what the reader sees
// as the same situation.
const cardStatus = computed<'idle' | 'pending' | 'success' | 'error'>(() => {
  const parts = [status.value, summaryStatus.value]
  if (parts.includes('error'))
    return 'error'
  if (parts.includes('pending'))
    return 'pending'
  if (parts.includes('idle'))
    return 'idle'
  return 'success'
})

const cardError = computed(() => error.value ?? summaryError.value)
const isEmpty = computed(() => !data.value?.dates?.length || !summary.value)

const period = computed(() => data.value?.period)
const prevPeriod = computed(() => data.value?.prevPeriod)

async function retry() {
  await Promise.all([refresh(), refreshSummary()])
}
</script>

<template>
  <div>
    <CardTitle>
      <NuxtLink :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/overview`" class="flex min-h-11 items-center gap-2 rounded-md text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <SiteFavicon :site="site" />
        <h2 class="font-semibold text-highlighted">
          {{ siteLabel(site) }}
        </h2>
      </NuxtLink>
    </CardTitle>
    <UCard :ui="{ body: 'p-3 sm:p-4' }">
      <ClientOnly>
        <AsyncCardState
          :status="cardStatus"
          :error="cardError"
          :empty="isEmpty"
          label="site performance"
          empty-message="No search data for this period."
          min-height="min-h-40"
          :rows="4"
          @retry="retry"
        >
          <div class="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_16rem] md:items-center">
            <GscdumpChart class="min-w-0" :gscdump-site-id="site.gscdumpSiteId!" />
            <div class="grid grid-cols-2 gap-2 border-t border-default pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
              <div class="flex min-h-16 flex-col justify-center px-3 py-2">
                <div class="text-sm text-muted">
                  Clicks
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="font-mono text-xl font-semibold text-highlighted tabular-nums">
                    {{ useHumanFriendlyNumber(period?.clicks ?? 0) }}
                  </span>
                  <TrendPercentage v-if="prevPeriod" compact :value="period?.clicks ?? 0" :prev-value="prevPeriod.clicks" />
                </div>
              </div>
              <div class="flex min-h-16 flex-col justify-center px-3 py-2">
                <div class="text-sm text-muted">
                  Views
                </div>
                <div class="flex items-baseline gap-1">
                  <span class="font-mono text-xl font-semibold text-highlighted tabular-nums">
                    {{ useHumanFriendlyNumber(period?.impressions ?? 0) }}
                  </span>
                  <TrendPercentage v-if="prevPeriod" compact :value="period?.impressions ?? 0" :prev-value="prevPeriod.impressions" />
                </div>
              </div>
              <NuxtLink
                :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/keywords`"
                :aria-label="`View ${siteLabel(site)} keywords`"
                class="flex min-h-16 flex-col justify-center rounded-lg px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div class="text-sm text-muted">
                  Keywords
                </div>
                <div class="font-mono text-xl font-semibold text-highlighted tabular-nums">
                  {{ useHumanFriendlyNumber(summary?.queries ?? 0) }}
                </div>
              </NuxtLink>
              <NuxtLink
                :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/pages`"
                :aria-label="`View ${siteLabel(site)} pages`"
                class="flex min-h-16 flex-col justify-center rounded-lg px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div class="text-sm text-muted">
                  Pages
                </div>
                <div class="font-mono text-xl font-semibold text-highlighted tabular-nums">
                  {{ useHumanFriendlyNumber(summary?.pages ?? 0) }}
                </div>
              </NuxtLink>
            </div>
          </div>
        </AsyncCardState>

        <template #fallback>
          <div class="flex min-h-40 w-full flex-col justify-center gap-2" aria-live="polite" aria-busy="true">
            <span class="sr-only">Loading site performance</span>
            <USkeleton v-for="row in 4" :key="row" class="h-4 w-full" />
          </div>
        </template>
      </ClientOnly>
    </UCard>
  </div>
</template>

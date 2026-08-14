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

const isPending = computed(() => status.value === 'pending' || summaryStatus.value === 'pending')
const hasError = computed(() => Boolean(error.value || summaryError.value))

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
        <div>
          <div v-if="isPending" class="flex min-h-40 w-full items-center justify-center" aria-live="polite">
            <UIcon name="i-heroicons-arrow-path" class="size-7 animate-spin text-muted" />
            <span class="sr-only">Loading site performance</span>
          </div>
          <div v-else-if="hasError" class="flex min-h-40 flex-col items-center justify-center gap-3 text-center" role="alert">
            <UIcon name="i-lucide-cloud-off" class="size-6 text-error" />
            <div>
              <p class="font-medium text-highlighted">
                Site data could not load
              </p>
              <p class="text-sm text-muted">
                Retry to refresh this site's performance.
              </p>
            </div>
            <UButton label="Retry" color="neutral" variant="outline" size="sm" class="min-h-11" @click="retry" />
          </div>
          <div v-else-if="data?.dates?.length && summary" class="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_12rem] md:items-center">
            <GscdumpChart class="min-w-0" :gscdump-site-id="site.gscdumpSiteId!" />
            <div class="grid grid-cols-2 gap-2 border-t border-default pt-3 md:border-l md:border-t-0 md:pl-4 md:pt-0">
              <NuxtLink
                :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/keywords`"
                :aria-label="`View ${siteLabel(site)} keywords`"
                class="flex min-h-16 items-center rounded-lg px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div>
                  <div class="text-sm text-muted">
                    Keywords
                  </div>
                  <div class="font-mono text-xl font-semibold text-highlighted tabular-nums">
                    {{ useHumanFriendlyNumber(summary.queries) }}
                  </div>
                </div>
              </NuxtLink>
              <NuxtLink
                :to="`/dashboard/site/${encodeURIComponent(site.siteId)}/pages`"
                :aria-label="`View ${siteLabel(site)} pages`"
                class="flex min-h-16 items-center rounded-lg px-3 py-2 transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div>
                  <div class="text-sm text-muted">
                    Pages
                  </div>
                  <div class="font-mono text-xl font-semibold text-highlighted tabular-nums">
                    {{ useHumanFriendlyNumber(summary.pages) }}
                  </div>
                </div>
              </NuxtLink>
            </div>
          </div>
          <div v-else class="w-full py-8 text-center text-sm text-muted">
            No data available for this period.
          </div>
        </div>

        <template #fallback>
          <div class="flex min-h-40 w-full items-center justify-center" aria-live="polite">
            <UIcon name="i-heroicons-arrow-path" class="size-7 animate-spin text-muted" />
            <span class="sr-only">Loading site performance</span>
          </div>
        </template>
      </ClientOnly>
    </UCard>
  </div>
</template>

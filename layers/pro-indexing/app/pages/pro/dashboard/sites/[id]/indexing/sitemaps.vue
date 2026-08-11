<script lang="ts" setup>
import { gscConsoleUrl } from '@gscdump/sdk/gsc-console-url'
import { useProGscdumpSitemapChanges, useProGscdumpSitemaps } from '#layers/pro-gsc/app/composables/useProGscdump'

definePageMeta({ proTab: { feature: 'indexing', label: 'Sitemaps', icon: 'i-lucide-map', order: 20 } })

const { gscdumpSiteId } = useSite()
const { period } = useSitePeriod()
const dateRange = computed(() => periodToDateRange(period.value))
const periodLabel = computed(() => {
  const p = PERIOD_PRESETS.find(pr => pr.value === period.value)
  return p?.shortLabel ?? `${dateRange.value.days}d`
})

const { data: sitemapsData } = useProGscdumpSitemaps(
  computed(() => gscdumpSiteId.value ?? undefined),
  { immediate: !!gscdumpSiteId.value },
)

const { data: changesData } = useProGscdumpSitemapChanges(
  computed(() => gscdumpSiteId.value ?? undefined),
  computed(() => dateRange.value.days),
  { immediate: !!gscdumpSiteId.value },
)

interface SitemapRow {
  id: string
  name: string
  path: string
  urlCount: number
  isIndex: boolean
  errors: number
  warnings: number
  lastDownloaded: string | null
  lastError: string | null
  isPending: boolean
  contentChanged: boolean
  urlDelta: number
}

const rows = computed<SitemapRow[]>(() => {
  if (!sitemapsData.value?.sitemaps?.length)
    return []
  return sitemapsData.value.sitemaps.map((s) => {
    const latest = sitemapsData.value?.perSitemapHistory?.[s.path]?.at(-1)
    return {
      id: s.path,
      name: getSitemapName(s.path),
      path: s.path,
      urlCount: s.urlCount,
      isIndex: s.isIndex ?? false,
      errors: s.errors,
      warnings: s.warnings,
      lastDownloaded: s.lastDownloaded,
      lastError: s.lastError,
      isPending: s.isPending,
      contentChanged: latest?.changed ?? false,
      urlDelta: latest?.urlDelta ?? 0,
    }
  })
})

const loading = computed(() => !sitemapsData.value)
const totalUrls = computed(() => rows.value.filter(s => !s.isIndex).reduce((sum, s) => sum + s.urlCount, 0))
const totalErrors = computed(() => rows.value.reduce((sum, s) => sum + s.errors, 0))
const netChange = computed(() => (changesData.value?.summary?.totalAdded ?? 0) - (changesData.value?.summary?.totalRemoved ?? 0))

// Health alerts
const healthAlerts = computed(() => {
  const alerts: { color: 'error' | 'warning', icon: string, title: string, description: string, action?: { label: string, to: string } }[] = []

  const fetchErrors = rows.value.filter(s => s.lastError)
  if (fetchErrors.length)
    alerts.push({ color: 'error', icon: 'i-lucide-wifi-off', title: 'Sitemap fetch failures', description: `${fetchErrors.length} sitemap${fetchErrors.length === 1 ? '' : 's'} failed to load: ${fetchErrors.map(s => s.name).join(', ')}.` })

  if (totalErrors.value > 0 && !fetchErrors.length)
    alerts.push({ color: 'error', icon: 'i-lucide-alert-circle', title: 'Sitemap errors detected', description: `${totalErrors.value} error${totalErrors.value === 1 ? '' : 's'} found. Errors may prevent Google from reading URLs.`, action: { label: 'Validate', to: '/tools/xml-sitemap-validator' } })

  const pending = rows.value.filter(s => s.isPending)
  if (pending.length)
    alerts.push({ color: 'warning', icon: 'i-lucide-clock', title: 'Sitemaps pending', description: `${pending.length} sitemap${pending.length === 1 ? '' : 's'} not yet processed. Check back in 24-48h.` })

  if (changesData.value?.summary?.totalRemoved && totalUrls.value > 0) {
    const pct = Math.round((changesData.value.summary.totalRemoved / totalUrls.value) * 100)
    if (pct >= 10)
      alerts.push({ color: 'warning', icon: 'i-lucide-trending-down', title: 'Significant URL removal', description: `${changesData.value.summary.totalRemoved} URLs (${pct}%) removed in the last 7 days.` })
  }

  return alerts
})

// URL change timeline
const urlChangeTimeline = computed(() => {
  if (!sitemapsData.value?.history?.length)
    return []
  return sitemapsData.value.history.toReversed().map(h => ({
    date: h.date,
    urlCount: h.urlCount,
    urlDelta: h.urlDelta,
    errors: h.errors,
    warnings: h.warnings,
  }))
})

const hasUrlChanges = computed(() => urlChangeTimeline.value.some(d => d.urlDelta !== 0))

// Content change days
const contentChangeDates = computed(() => {
  if (!sitemapsData.value?.perSitemapHistory)
    return new Set<string>()
  const dates = new Set<string>()
  for (const entries of Object.values(sitemapsData.value.perSitemapHistory)) {
    for (const entry of entries) {
      if (entry.changed)
        dates.add(entry.date)
    }
  }
  return dates
})

const recentUrlChanges = computed(() =>
  urlChangeTimeline.value
    .filter(d => d.urlDelta !== 0 || contentChangeDates.value.has(d.date))
    .slice(-10)
    .reverse(),
)

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime()))
    return dateStr
  const now = new Date()
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  if (d.getFullYear() !== now.getFullYear())
    opts.year = 'numeric'
  return d.toLocaleDateString('en', opts)
}

// Recent changes
function normalizeChangeItem(item: { url: string, sitemap: string, firstSeenAt?: number, removedAt?: number }): { url: string, sitemap: string, ts: number } {
  return { url: item.url, sitemap: item.sitemap, ts: item.firstSeenAt ?? item.removedAt ?? 0 }
}
const recentAdded = computed(() => (changesData.value?.added?.slice(0, 5) ?? []).map(normalizeChangeItem))
const recentRemoved = computed(() => (changesData.value?.removed?.slice(0, 5) ?? []).map(normalizeChangeItem))

function displayUrl(url: string): string {
  if (!url)
    return '/'
  const path = getPath(url)
  if (path && path !== '/')
    return path
  try {
    return new URL(url).hostname || url
  }
  catch {
    return url
  }
}

function relativeTime(ts: number | string | undefined): string {
  if (!ts)
    return ''
  let ms: number
  if (typeof ts === 'string')
    ms = new Date(ts).getTime()
  else
    ms = ts < 1e12 ? ts * 1000 : ts
  if (Number.isNaN(ms))
    return ''
  const days = Math.floor((Date.now() - ms) / 86_400_000)
  if (days <= 0)
    return 'today'
  if (days === 1)
    return '1d ago'
  return `${days}d ago`
}

const heroStats = computed(() => [
  {
    title: 'Sitemaps',
    tooltip: 'Total sitemaps registered in Google Search Console',
    value: rows.value.length,
    suffix: rows.value.length === 1 ? 'sitemap' : 'sitemaps',
    icon: 'i-lucide-file-text',
    status: totalErrors.value > 0 ? 'crisis' as const : rows.value.length ? 'good' as const : undefined,
  },
  {
    title: 'URLs',
    tooltip: 'Total URLs across all sitemaps',
    value: useProHumanFriendlyNumber(totalUrls.value),
    trend: changesData.value?.summary ? netChange.value : undefined,
    trendSuffix: ' (7d)',
    icon: 'i-lucide-link',
  },
])

function sitemapHealth(r: SitemapRow): SemanticStatus {
  if (r.errors > 0)
    return 'error'
  if (r.warnings > 0)
    return 'warning'
  return 'success'
}
</script>

<template>
  <div class="flex flex-col *:min-w-0">
    <!-- ═══ HERO ZONE ═══ -->
    <ProPageZone tier="primary" first>
      <UiStats :data="heroStats" variant="cards" />

      <!-- Alerts -->
      <Alert
        v-for="alert in healthAlerts"
        :key="alert.title"
        :color="alert.color"
        :icon="alert.icon"
        :title="alert.title"
        :description="alert.description"
      >
        <template v-if="alert.action" #action>
          <UiMotionButton :to="alert.action.to" size="xs" color="neutral" variant="subtle" icon="i-lucide-scan-search">
            {{ alert.action.label }}
          </UiMotionButton>
        </template>
      </Alert>
    </ProPageZone>

    <!-- ═══ SECONDARY ZONE ═══ -->
    <ProPageZone tier="secondary">
      <!-- Loading -->
      <Card v-if="loading">
        <UiSkeleton :lines="4" :base="200" :range="100" />
      </Card>

      <!-- Empty -->
      <EmptyState
        v-else-if="!rows.length"
        icon="i-lucide-file-x"
        title="No sitemaps found"
        description="No sitemaps registered in Google Search Console."
      >
        <UiMotionButton
          v-if="sitemapsData?.meta?.siteUrl"
          :to="gscConsoleUrl({ siteLabel: sitemapsData.meta.siteUrl, resource: 'sitemaps' })"
          target="_blank"
          size="xs"
          color="primary"
          variant="subtle"
          trailing-icon="i-lucide-external-link"
        >
          Open Search Console
        </UiMotionButton>
      </EmptyState>

      <!-- Sitemaps + URL Changes side by side -->
      <ProSecondaryGrid v-if="!loading && rows.length" layout="equal">
        <DataList
          title="Sitemaps"
          icon="i-lucide-file-text"
          :items="rows"
          :metric-label="`${useProHumanFriendlyNumber(totalUrls)} URLs`"
          :bar-value="(item: SitemapRow) => item.urlCount"
          :bar-total="totalUrls"
        >
          <template #default="{ item }: { item: SitemapRow }">
            <div class="relative z-1 flex items-center justify-between w-full gap-3 py-0.5">
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <DotLabel :dot-class="semanticColors[sitemapHealth(item)].dot" dot-size="2">
                  <span class="text-sm text-default truncate">{{ item.name }}</span>
                </DotLabel>
                <UTooltip v-if="item.contentChanged" text="Content changed recently">
                  <UIcon name="i-lucide-refresh-cw" class="size-3 text-dimmed shrink-0" />
                </UTooltip>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[13px] tabular-nums text-default font-semibold">{{ useProHumanFriendlyNumber(item.urlCount) }}</span>
                <Chip v-if="item.urlDelta !== 0" :tone="item.urlDelta > 0 ? 'success' : 'error'" tabular>
                  {{ item.urlDelta > 0 ? '+' : '' }}{{ item.urlDelta }}
                </Chip>
              </div>
            </div>
          </template>
        </DataList>

        <DataList
          v-if="(hasUrlChanges || contentChangeDates.size > 0) && urlChangeTimeline.length > 1"
          title="URL Changes"
          icon="i-lucide-git-commit"
          :items="recentUrlChanges"
          :metric-label="periodLabel"
        >
          <template #default="{ item }">
            <div class="relative z-1 flex items-center justify-between w-full gap-3 py-0.5">
              <span class="text-sm text-default">{{ formatShortDate(item.date) }}</span>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-[13px] tabular-nums text-muted">{{ useProHumanFriendlyNumber(item.urlCount) }} URLs</span>
                <Chip v-if="item.urlDelta !== 0" :tone="item.urlDelta > 0 ? 'success' : 'error'" tabular>
                  {{ item.urlDelta > 0 ? '+' : '' }}{{ item.urlDelta }}
                </Chip>
                <UTooltip v-if="contentChangeDates.has(item.date)" text="Content changed">
                  <UIcon name="i-lucide-refresh-cw" class="size-3 text-dimmed shrink-0" />
                </UTooltip>
              </div>
            </div>
          </template>
        </DataList>
      </ProSecondaryGrid>

      <!-- Recent changes -->
      <ProSecondaryGrid v-if="recentAdded.length || recentRemoved.length" layout="equal">
        <DataList
          v-if="recentAdded.length"
          title="Recently Added"
          icon="i-lucide-plus"
          :items="recentAdded"
          :metric-label="changesData?.summary ? `${changesData.summary.totalAdded} total` : undefined"
        >
          <template #default="{ item }">
            <a :href="item.url" target="_blank" rel="noopener" class="relative z-1 flex items-center gap-3 w-full group/url" @click.stop>
              <span class="flex-1 min-w-0 text-[13px] text-muted truncate group-hover/url:text-default transition-colors" :title="item.url">{{ displayUrl(item.url) }}</span>
              <span class="text-[11px] text-dimmed tabular-nums shrink-0">{{ relativeTime(item.ts) }}</span>
            </a>
          </template>
        </DataList>

        <DataList
          v-if="recentRemoved.length"
          title="Recently Removed"
          icon="i-lucide-minus"
          :items="recentRemoved"
          :metric-label="changesData?.summary ? `${changesData.summary.totalRemoved} total` : undefined"
        >
          <template #default="{ item }">
            <div class="relative z-1 flex items-center gap-3 w-full">
              <span class="flex-1 min-w-0 text-[13px] text-dimmed truncate" :title="item.url">{{ displayUrl(item.url) }}</span>
              <span class="text-[11px] text-dimmed tabular-nums shrink-0">{{ relativeTime(item.ts) }}</span>
            </div>
          </template>
        </DataList>
      </ProSecondaryGrid>
    </ProPageZone>
  </div>
</template>

<script lang="ts" setup>
import type { IssueSeverity } from '#layers/pro-indexing/app/utils/indexing-issues'
import { useProGscdump, useProGscdumpIndexing, useProGscdumpIndexingDiagnostics, useProGscdumpSitemaps } from '#layers/pro-gsc/app/composables/useProGscdump'
import { issueIcons } from '#layers/pro-indexing/app/utils/indexing-issues'

definePageMeta({ proTab: { feature: 'indexing', label: 'Overview', icon: 'i-lucide-layout-dashboard', order: 0 } })

const { siteId, gscdumpSiteId, isNotConnected, isProcessing, isReady } = useSite()
const { period, stableData } = useSitePeriod()
const { createSitemapAction } = useProGscdump()
const toast = useToast()

const submittingSitemap = ref(false)
async function autoDiscoverSitemap() {
  if (!gscdumpSiteId.value)
    return
  submittingSitemap.value = true
  const res = await createSitemapAction<{ discovered: string | null, submitError?: string | null }>({
    params: { siteId: gscdumpSiteId.value },
    body: { action: 'auto-discover' },
  }, true).catch(() => null)
  submittingSitemap.value = false
  if (res?.discovered && !res.submitError) {
    toast.add({ title: 'Sitemap submitted', description: res.discovered, color: 'success' })
  }
  else if (res?.discovered && res.submitError) {
    toast.add({ title: 'Sitemap found but failed to submit', description: res.submitError, color: 'error' })
  }
  else {
    toast.add({ title: 'No sitemap found', description: 'Could not find a sitemap via robots.txt or common paths. Submit one manually in Search Console.', color: 'warning' })
  }
}

// --- Indexing data ---
const { data: indexingData, status: indexingStatus, error: indexingError } = useProGscdumpIndexing(
  computed(() => gscdumpSiteId.value ?? ''),
  computed(() => periodToDateRange(period.value, stableData.value).days),
) as { data: Ref<any>, status: Ref<any>, error: Ref<any> }

const indexingMeta = computed(() => indexingData.value?.meta)
const indexingNotReady = computed(() => {
  if (isProcessing.value && !isReady.value)
    return true
  if (indexingMeta.value?.indexingStatus === 'pending')
    return true
  return false
})
const overviewLoading = computed(() => (indexingStatus.value === 'pending' || indexingStatus.value === 'idle') && !indexingData.value)
const summary = computed(() => indexingData.value?.summary)

// --- Computed metrics from trend data ---
const latestErrors = computed(() => {
  if (!indexingData.value?.trend.length)
    return 0
  const latest = indexingData.value.trend.at(-1)
  return (latest.issues.notFound || 0)
    + (latest.issues.soft404 || 0)
    + (latest.issues.serverError || 0)
})

// --- Index drop alert ---
// Detect whether total URLs grew (new pages added) vs pages actually dropping out
const totalUrlsGrowth = computed(() => {
  const trend = indexingData.value?.trend
  if (!trend?.length || trend.length < 2)
    return 0
  return trend.at(-1)!.totalUrls - trend[0].totalUrls
})

const indexDropAlert = computed(() => {
  const s = summary.value
  if (!s)
    return null
  // Check 7-day change first, then 28-day
  let drop: { percentDrop: number, period: string } | null = null
  if (s.change7d != null && s.change7d <= -2) {
    drop = { percentDrop: Math.abs(s.change7d), period: '7 days' }
  }
  else if (s.change28d != null && s.change28d <= -5) {
    drop = { percentDrop: Math.abs(s.change28d), period: '28 days' }
  }
  if (!drop)
    return null
  // If total URLs grew, this is likely dilution from new pages — less severe
  const newPagesAdded = totalUrlsGrowth.value > 0
  return { ...drop, newPagesAdded }
})

// --- Hero sparklines ---
const totalUrlsSparkline = computed(() =>
  indexingData.value?.trend?.map((t: any, i: number) => ({ x: i, value: t.totalUrls })) ?? [],
)
const indexedCountSparkline = computed(() =>
  indexingData.value?.trend?.map((t: any, i: number) => ({ x: i, value: Math.round(t.totalUrls * t.indexedPercent / 100) })) ?? [],
)

// Index rate health status
const indexRateStatus = computed(() => {
  if (!summary.value)
    return undefined
  if (summary.value.indexedPercent >= 90)
    return 'good' as const
  if (summary.value.indexedPercent < 50)
    return 'crisis' as const
  return 'warning' as const
})

// --- Diagnostics + Sitemaps for overview panels ---
const { data: diagnosticsData } = useProGscdumpIndexingDiagnostics(
  computed(() => gscdumpSiteId.value ?? ''),
  { immediate: !!gscdumpSiteId.value },
) as { data: Ref<any> }

const { data: sitemapsData } = useProGscdumpSitemaps(
  computed(() => gscdumpSiteId.value ?? undefined),
  { immediate: !!gscdumpSiteId.value },
) as { data: Ref<any> }

// --- Unified top issues ---
interface TopIssue {
  id: string
  label: string
  severity: IssueSeverity
  count: number
  source: 'indexing' | 'sitemap'
  icon: string
  issueType?: string
  sitemapPath?: string
}

const topIssues = computed<TopIssue[]>(() => {
  const items: TopIssue[] = []

  if (diagnosticsData.value?.issues) {
    for (const i of diagnosticsData.value.issues) {
      if (i.count > 0 && i.type !== 'not_indexed') {
        items.push({
          id: `idx-${i.type}`,
          label: i.label,
          severity: i.severity,
          count: i.count,
          source: 'indexing',
          icon: issueIcons[i.type] || 'i-lucide-alert-circle',
          issueType: i.type,
        })
      }
    }
  }

  if (sitemapsData.value?.sitemaps) {
    for (const s of sitemapsData.value.sitemaps) {
      if (s.errors > 0) {
        items.push({
          id: `sm-err-${s.path}`,
          label: `${getSitemapName(s.path)} — ${s.errors} error${s.errors === 1 ? '' : 's'}`,
          severity: 'error',
          count: s.errors,
          source: 'sitemap',
          icon: 'i-lucide-file-x',
          sitemapPath: s.path,
        })
      }
      if (s.warnings > 0) {
        items.push({
          id: `sm-warn-${s.path}`,
          label: `${getSitemapName(s.path)} — ${s.warnings} warning${s.warnings === 1 ? '' : 's'}`,
          severity: 'warning',
          count: s.warnings,
          source: 'sitemap',
          icon: 'i-lucide-file-warning',
          sitemapPath: s.path,
        })
      }
    }
  }

  const order: Record<string, number> = { error: 0, warning: 1, info: 2 }
  return items.sort((a, b) => {
    const sevDiff = (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
    if (sevDiff !== 0)
      return sevDiff
    return b.count - a.count
  })
})

const topIssuesSlice = computed(() => topIssues.value.slice(0, 7))

// Smart summary text
const notIndexedCount = computed(() => {
  if (!summary.value)
    return 0
  return summary.value.totalUrls - summary.value.indexed
})

const summaryTitle = computed(() => {
  if (!summary.value)
    return ''
  const pct = summary.value.indexedPercent
  if (pct >= 95)
    return 'Indexing looks healthy'
  if (pct >= 80)
    return 'Most pages are indexed'
  if (pct >= 50)
    return 'Indexing needs attention'
  return 'Indexing issues detected'
})

// --- Aggregate crawl pipeline ---
function issueCount(type: string): number {
  return diagnosticsData.value?.issues?.find((i: any) => i.type === type)?.count ?? 0
}

type PipelineStatus = 'success' | 'error' | 'warning' | 'neutral'

const aggregatePipeline = computed(() => {
  if (!summary.value || !diagnosticsData.value)
    return null

  const total = summary.value.totalUrls
  if (!total)
    return null

  const blocked = issueCount('blocked_robots')
  const fetchFails = issueCount('not_found') + issueCount('soft_404') + issueCount('server_error')
  const noindex = issueCount('noindex')
  const indexed = summary.value.indexed

  const robotsPass = total - blocked
  const fetchPass = robotsPass - fetchFails
  const indexingPass = fetchPass - noindex

  function stepStatus(pass: number, total: number): PipelineStatus {
    if (pass === total)
      return 'success'
    if (pass < total)
      return 'error'
    return 'neutral'
  }

  function pct(pass: number, of: number): string {
    return of > 0 ? `${Math.round((pass / of) * 100)}%` : '—'
  }

  return [
    {
      label: 'Discovered',
      icon: 'i-lucide-radar',
      status: 'neutral' as PipelineStatus,
      displayValue: useProHumanFriendlyNumber(total),
      value: `${total} URLs`,
      raw: total,
      tooltip: `${useProHumanFriendlyNumber(total)} total URLs known to Google`,
      sparkline: totalUrlsSparkline.value.map((d: any) => d.value),
    },
    {
      label: 'Crawled',
      icon: 'i-lucide-bot',
      status: stepStatus(fetchPass, robotsPass),
      displayValue: useProHumanFriendlyNumber(fetchPass),
      value: pct(fetchPass, total),
      raw: fetchPass,
      tooltip: `${useProHumanFriendlyNumber(fetchPass)} of ${useProHumanFriendlyNumber(total)} successfully fetched`,
      to: fetchFails > 0 ? indexingRoute('urls', { issue: 'not_found' }) : undefined,
    },
    {
      label: 'Indexable',
      icon: 'i-lucide-file-check',
      status: stepStatus(indexingPass, fetchPass),
      displayValue: useProHumanFriendlyNumber(indexingPass),
      value: pct(indexingPass, total),
      raw: indexingPass,
      tooltip: `${useProHumanFriendlyNumber(indexingPass)} of ${useProHumanFriendlyNumber(total)} allowed for indexing`,
      to: noindex > 0 ? indexingRoute('urls', { issue: 'noindex' }) : undefined,
    },
    {
      label: 'Indexed',
      icon: 'i-lucide-database',
      status: stepStatus(indexed, indexingPass),
      displayValue: useProHumanFriendlyNumber(indexed),
      value: `${summary.value!.indexedPercent.toFixed(1)}%`,
      raw: indexed,
      tooltip: `${useProHumanFriendlyNumber(indexed)} of ${useProHumanFriendlyNumber(total)} in Google's index`,
      sparkline: indexedCountSparkline.value.map((d: any) => d.value),
      to: indexingRoute('urls'),
    },
  ]
})

// Funnel-shaped steps derived from the same source data
const funnelSteps = computed(() => {
  if (!aggregatePipeline.value)
    return []
  return aggregatePipeline.value.map((s: any) => ({
    key: s.label,
    label: s.label,
    value: s.raw,
    displayValue: s.displayValue,
    tooltip: s.tooltip,
    to: s.to,
  }))
})

const funnelDelta = computed(() => {
  const change = summary.value?.change7d
  if (change == null)
    return undefined
  const dir: 'up' | 'down' | 'flat' = change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  return { value: `${Math.abs(change).toFixed(1)}% vs prior 7 days`, direction: dir }
})

const funnelContext = computed(() => {
  if (!summary.value)
    return undefined
  return `${useProHumanFriendlyNumber(summary.value.indexed)} indexed of ${useProHumanFriendlyNumber(summary.value.totalUrls)} discovered`
})
const topIssuesLoading = computed(() => !diagnosticsData.value && !sitemapsData.value)

// --- Signals ---
const signals = computed(() => summary.value?.signals)
const hasMobileData = computed(() => {
  if (!signals.value)
    return false
  return (signals.value.mobilePass + signals.value.mobileFail) > 0
})
const hasRichResults = computed(() => {
  if (!signals.value)
    return false
  return signals.value.richResultTypes.length > 0
})
const mobileFriendlyPercent = computed(() => {
  if (!signals.value)
    return 0
  const total = signals.value.mobilePass + signals.value.mobileFail
  return total > 0 ? Math.round((signals.value.mobilePass / total) * 100) : 0
})
const mobileStats = computed(() => {
  if (!signals.value)
    return []
  const items = [
    { label: 'Mobile Friendly', count: signals.value.mobilePass, icon: 'i-lucide-check-circle', iconColor: semanticColors.success.text },
  ]
  if (signals.value.mobileFail > 0)
    items.push({ label: 'Mobile Issues', count: signals.value.mobileFail, icon: 'i-lucide-alert-triangle', iconColor: semanticColors.warning.text })
  items.push(
    { label: 'Mobile Googlebot', count: signals.value.crawlingMobile, icon: 'i-lucide-smartphone', iconColor: 'text-dimmed' },
    { label: 'Desktop Googlebot', count: signals.value.crawlingDesktop, icon: 'i-lucide-monitor', iconColor: 'text-dimmed' },
  )
  return items
})

// Sitemaps overview items
const sitemapItems = computed(() => {
  if (!sitemapsData.value?.sitemaps?.length)
    return []
  return sitemapsData.value.sitemaps.map((s: any) => {
    const history = sitemapsData.value?.perSitemapHistory?.[s.path]
    const latest = history?.at(-1)
    return {
      name: getSitemapName(s.path),
      path: s.path,
      urlCount: s.urlCount,
      errors: s.errors,
      warnings: s.warnings,
      contentChanged: latest?.changed ?? false,
      urlDelta: latest?.urlDelta ?? 0,
    }
  })
})
const totalSitemapUrls = computed(() => sitemapItems.value.reduce((sum: number, s: any) => sum + s.urlCount, 0))
const totalUrlDelta = computed(() => {
  const latest = sitemapsData.value?.history?.[0]
  return latest?.urlDelta ?? 0
})

// Route helpers for linking to sibling pages
function indexingRoute(page: string, query?: Record<string, string>) {
  const base = `/pro/dashboard/sites/${siteId.value}/indexing/${page}`
  if (!query || Object.keys(query).length === 0)
    return base
  const qs = new URLSearchParams(query).toString()
  return `${base}?${qs}`
}
</script>

<template>
  <div data-testid="indexing-page">
    <!-- Syncing: not enough data yet -->
    <EmptyState
      v-if="indexingNotReady"
      icon="i-lucide-loader"
      :title="isProcessing && !isReady ? 'Importing search data...' : 'Collecting indexing data...'"
      :description="isProcessing && !isReady
        ? 'Search Console data is being synced. Indexing coverage will appear once the initial import completes.'
        : 'URLs are being inspected via Google\'s URL Inspection API. This runs daily and may take a few days to cover all pages.'"
    >
      <!-- Progress bar for partial indexing -->
      <div v-if="indexingMeta?.indexingProgress != null && indexingMeta.indexingProgress > 0" class="w-48 mx-auto">
        <div class="flex items-center justify-between text-xs text-muted mb-1.5">
          <span>{{ useProHumanFriendlyNumber(indexingMeta.inspectedCount) }} / {{ useProHumanFriendlyNumber(indexingMeta.sitemapTotal) }} URLs</span>
          <span class="tabular-nums font-medium">{{ indexingMeta.indexingProgress }}%</span>
        </div>
        <div class="h-1.5 bg-accented rounded-full overflow-hidden">
          <div
            class="h-full rounded-full bg-primary transition-[width] duration-500"
            :style="{ width: `${indexingMeta.indexingProgress}%` }"
          />
        </div>
      </div>
    </EmptyState>

    <template v-else>
      <!-- Alert zone (severity order: error → warning → info) -->
      <div class="flex flex-col gap-3 mb-6">
        <!-- Indexing error alert -->
        <Alert
          v-if="indexingError && !isNotConnected && indexingStatus !== 'pending'"
          color="error"
          :title="indexingError.data?.message || 'Failed to load indexing data'"
        >
          <template #action>
            <UiMotionButton size="xs" color="neutral" variant="subtle" @click="$router.go(0)">
              Retry
            </UiMotionButton>
          </template>
        </Alert>

        <!-- Index drop alert -->
        <Alert
          v-if="indexDropAlert"
          :color="indexDropAlert.newPagesAdded ? 'warning' : 'error'"
          :icon="indexDropAlert.newPagesAdded ? 'i-lucide-plus-circle' : 'i-lucide-trending-down'"
          :title="indexDropAlert.newPagesAdded ? 'New pages diluting index rate' : 'Index coverage dropping'"
          :description="indexDropAlert.newPagesAdded
            ? `Index rate fell ${indexDropAlert.percentDrop.toFixed(1)}% over the last ${indexDropAlert.period}, but ${useProHumanFriendlyNumber(totalUrlsGrowth)} new URLs were added. Google hasn't indexed them yet, this usually resolves on its own.`
            : `Index rate fell ${indexDropAlert.percentDrop.toFixed(1)}% over the last ${indexDropAlert.period}. Pages may be falling out of Google's index.`"
        >
          <template #action>
            <UiMotionButton size="xs" color="neutral" variant="subtle" trailing-icon="i-lucide-arrow-right" :to="indexingRoute('urls', { status: 'not_indexed' })">
              View not-indexed URLs
            </UiMotionButton>
          </template>
        </Alert>

        <!-- Summary alert (hidden when index drop alert already provides context) -->
        <Alert
          v-if="summary && summaryTitle && !indexDropAlert"
          :color="indexRateStatus === 'good' ? 'success' : indexRateStatus === 'crisis' ? 'error' : 'warning'"
          :icon="indexRateStatus === 'good' ? 'i-lucide-check-circle' : indexRateStatus === 'crisis' ? 'i-lucide-alert-triangle' : 'i-lucide-info'"
          :title="summaryTitle"
        >
          <span v-if="notIndexedCount > 0 || latestErrors > 0" class="text-muted">
            <template v-if="notIndexedCount > 0">
              <span class="font-semibold text-default">{{ useProHumanFriendlyNumber(notIndexedCount) }}</span> of {{ useProHumanFriendlyNumber(summary!.totalUrls) }} pages ({{ (100 - summary!.indexedPercent).toFixed(0) }}%) aren't indexed.
            </template>
            <template v-if="latestErrors > 0">
              {{ ' ' }}<span class="font-semibold text-default">{{ latestErrors }}</span> error{{ latestErrors === 1 ? '' : 's' }} need{{ latestErrors === 1 ? 's' : '' }} attention.
            </template>
            <template v-if="summary!.change7d != null">
              {{ ' ' }}Index rate {{ summary!.change7d > 0 ? 'up' : 'down' }} <span class="font-semibold text-default">{{ Math.abs(summary!.change7d).toFixed(1) }}%</span> over 7 days.
            </template>
          </span>
          <template v-if="topIssues.length > 0" #action>
            <UiMotionButton size="xs" color="neutral" variant="subtle" trailing-icon="i-lucide-arrow-right" :to="indexingRoute('issues')">
              View all issues
            </UiMotionButton>
          </template>
        </Alert>

        <!-- No sitemaps submitted warning -->
        <Alert
          v-if="indexingMeta?.noSitemapsSubmitted"
          color="warning"
          title="No sitemap submitted in Google Search Console"
          description="We'll check robots.txt and common paths to find and submit your sitemap automatically."
        >
          <template #action>
            <div class="flex items-center gap-2">
              <UiMotionButton size="xs" color="neutral" variant="subtle" :loading="submittingSitemap" @click="autoDiscoverSitemap">
                Submit sitemap now
              </UiMotionButton>
              <UiMotionButton size="xs" variant="ghost" trailing-icon="i-lucide-external-link" to="https://search.google.com/search-console/sitemaps" target="_blank">
                Submit manually
              </UiMotionButton>
            </div>
          </template>
        </Alert>

        <!-- Sitemaps pending parse -->
        <Alert
          v-if="indexingMeta?.sitemapsPending"
          color="info"
          icon="i-lucide-loader"
          title="Sitemap submitted, will be parsed within 24 hours"
          description="Your sitemap has been submitted to Google Search Console. URLs will be available after the next daily sync."
        />
      </div>

      <!-- ═══ HERO ZONE ═══ -->
      <ProPageZone tier="primary" first :aria-busy="overviewLoading">
        <div v-if="overviewLoading && !aggregatePipeline" aria-hidden="true">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex flex-col gap-1.5">
              <UiSkeleton type="text" :index="1" :base="80" :range="20" />
              <UiSkeleton type="text" :index="2" :base="60" :range="20" class="!h-7" />
              <UiSkeleton type="text" :index="3" :base="180" :range="40" />
            </div>
            <UiSkeleton type="text" :index="4" :base="90" :range="20" />
          </div>
          <UiSkeleton type="text" :index="5" :base="800" :range="100" class="!h-[220px] !rounded" />
        </div>
        <ProFunnel
          v-else-if="funnelSteps.length"
          :steps="funnelSteps"
          :primary="summary ? `${summary.indexedPercent.toFixed(1)}%` : undefined"
          title="Index coverage"
          :context="funnelContext"
          :delta="funnelDelta"
          :height="220"
          aria-label="Indexing funnel: Discovered, Crawled, Indexable, Indexed"
        />
      </ProPageZone>

      <!-- ═══ SECONDARY ZONE ═══ -->
      <ProPageZone tier="secondary">
        <!-- Top Issues (full-width) -->
        <DataList
          v-if="topIssuesLoading || topIssuesSlice.length > 0"
          title="Top Issues"
          tooltip="Indexing and sitemap problems ordered by severity. Includes issues from Google's index coverage and your registered sitemaps."
          :loading="topIssuesLoading"
          :items="topIssuesSlice"
          :view-more-to="topIssues.length > 7 ? indexingRoute('issues') : undefined"
          :view-more-label="topIssues.length > 7 ? `View all ${topIssues.length} issues` : undefined"
          empty-icon="i-lucide-check-circle"
          empty-text="No issues detected — indexing and sitemaps are healthy"
          :bar-value="(item: any) => item.count"
        >
          <template #default="{ item: issue }">
            <NuxtLink
              :to="issue.source === 'sitemap'
                ? indexingRoute('sitemaps')
                : indexingRoute('urls', { issue: issue.issueType })"
              class="flex items-center gap-3 w-full text-left min-w-0"
            >
              <SeverityDot :severity="issue.severity" />
              <div
                class="flex items-center justify-center size-7 rounded-md shrink-0"
                :class="issue.severity === 'error' ? 'bg-error/8 text-error' : issue.severity === 'warning' ? 'bg-warning/8 text-warning' : 'bg-info/8 text-info'"
              >
                <UIcon :name="issue.icon" class="size-3.5" />
              </div>
              <span class="text-sm truncate flex-1">{{ issue.label }}</span>
            </NuxtLink>
            <div class="flex items-center gap-2 shrink-0">
              <span class="text-sm font-semibold tabular-nums text-default">
                {{ useProHumanFriendlyNumber(issue.count) }}
              </span>
              <UIcon name="i-lucide-chevron-right" class="size-3.5 text-dimmed" />
            </div>
          </template>
        </DataList>

        <!-- All clear state -->
        <EmptyState
          v-else
          icon="i-lucide-shield-check"
          title="All clear"
          description="No indexing or sitemap issues detected. All crawled URLs are healthy."
        >
          <div class="flex items-center justify-center gap-5">
            <SeverityDot severity="success" label="0 errors" />
            <SeverityDot severity="success" label="0 warnings" />
          </div>
        </EmptyState>
      </ProPageZone>

      <!-- ═══ TERTIARY ZONE ═══ -->
      <ProPageZone tier="tertiary">
        <ProSecondaryGrid layout="equal">
          <!-- Sitemaps -->
          <DataList
            v-if="sitemapItems.length"
            title="Sitemaps"
            tooltip="Sitemaps registered in Google Search Console. Errors or warnings may prevent proper indexing."
            :items="sitemapItems"
            :bar-value="(item: any) => item.urlCount"
            :view-more-to="indexingRoute('sitemaps')"
            view-more-label="View all"
          >
            <template #header-trailing>
              <div class="flex items-center gap-2">
                <span v-if="totalUrlDelta !== 0" class="text-[11px] tabular-nums font-medium" :class="semanticColors[trendToSemantic(totalUrlDelta)].text">
                  {{ totalUrlDelta > 0 ? '+' : '' }}{{ totalUrlDelta }}
                </span>
                <span class="text-xs text-dimmed tabular-nums">{{ useProHumanFriendlyNumber(totalSitemapUrls) }} URLs</span>
              </div>
            </template>
            <template #default="{ item: sm }">
              <NuxtLink :to="indexingRoute('sitemaps')" class="absolute inset-0 z-10" :aria-label="`View sitemap ${sm.name}`" />
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <UIcon name="i-lucide-file-text" class="size-3.5 text-muted shrink-0" />
                <span class="text-sm truncate">{{ sm.name }}</span>
                <UTooltip v-if="sm.contentChanged" text="Content changed recently">
                  <UIcon name="i-lucide-refresh-cw" class="size-3 text-dimmed shrink-0" />
                </UTooltip>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <Chip v-if="sm.errors > 0" tone="error" icon="i-lucide-alert-circle">
                  {{ sm.errors }}
                </Chip>
                <Chip v-if="sm.warnings > 0" tone="warning" icon="i-lucide-alert-triangle">
                  {{ sm.warnings }}
                </Chip>
                <SeverityDot v-if="!sm.errors && !sm.warnings" severity="success" />
                <span class="text-sm tabular-nums">{{ useProHumanFriendlyNumber(sm.urlCount) }}</span>
                <Chip
                  v-if="sm.urlDelta !== 0"
                  :tone="trendToSemantic(sm.urlDelta)"
                  tabular
                >
                  {{ sm.urlDelta > 0 ? '+' : '' }}{{ sm.urlDelta }}
                </Chip>
                <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
              </div>
            </template>
          </DataList>

          <!-- Signals column -->
          <div class="flex flex-col gap-6">
            <!-- Rich Results -->
            <DataList
              v-if="signals && hasRichResults"
              title="Rich Results"
              tooltip="Structured data detected on your indexed pages. Higher coverage means more chance of enhanced search results."
              :items="signals.richResultTypes"
              :bar-value="(item: any) => item.count"
              :view-more-to="indexingRoute('urls', { issue: 'rich_results_pass' })"
              view-more-label="View all URLs"
            >
              <template #header-trailing>
                <div class="flex items-center gap-2.5">
                  <SeverityDot severity="success" :label="`${signals.richResultsPass} valid`" />
                  <SeverityDot v-if="signals.richResultsFail > 0" severity="error" :label="`${signals.richResultsFail} invalid`" />
                </div>
              </template>
              <template #default="{ item: rt }">
                <NuxtLink :to="indexingRoute('urls', { issue: 'rich_results_pass', search: rt.type })" class="absolute inset-0 z-10" :aria-label="`View ${rt.type} rich results`" />
                <span class="text-sm truncate">{{ rt.type }}</span>
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="text-sm tabular-nums">{{ useProHumanFriendlyNumber(rt.count) }}</span>
                  <UIcon name="i-lucide-chevron-right" class="size-3 text-dimmed" />
                </div>
              </template>
            </DataList>

            <!-- Mobile & Crawling -->
            <DataList
              v-if="signals && hasMobileData"
              title="Mobile & Crawling"
              tooltip="Mobile usability verdicts and which Googlebot variant crawls your indexed pages."
              :items="mobileStats"
              :bar-value="(item: any) => item.count"
            >
              <template #header-trailing>
                <UiProgressCircle :percent="mobileFriendlyPercent" :size="28" :stroke-size="3" />
              </template>
              <template #default="{ item }">
                <div class="flex items-center gap-2">
                  <UIcon :name="item.icon" class="size-3.5" :class="item.iconColor" />
                  <span class="text-sm">{{ item.label }}</span>
                </div>
                <span class="text-sm tabular-nums">{{ useProHumanFriendlyNumber(item.count) }}</span>
              </template>
            </DataList>

            <!-- No signals data -->
            <EmptyState
              v-if="signals && !hasRichResults && !hasMobileData && !sitemapItems.length"
              icon="i-lucide-sparkles"
              title="No rich results or mobile data"
            />
          </div>
        </ProSecondaryGrid>
      </ProPageZone>
    </template>
  </div>
</template>

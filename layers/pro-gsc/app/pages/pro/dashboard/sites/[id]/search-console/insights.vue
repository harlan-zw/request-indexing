<script lang="ts" setup>
import type { AnalysisResult } from '@gscdump/engine/analysis-types'
import { CurveType } from '@unovis/ts'
import { VisAxis, VisCrosshair, VisLine, VisTooltip, VisXYContainer } from '@unovis/vue'
import { useTrackGscEngine } from '#layers/pro-gsc/app/composables/useGscEngineStats'
import { periodToDateRange } from '#layers/pro-gsc/app/composables/useGscPeriod'
import { useGscQuery } from '#layers/pro-gsc/app/composables/useGscQuery'
import { useProGscdump } from '#layers/pro-gsc/app/composables/useProGscdump'
import ProPositionDistribution from '../../../../../../internal/components/pro/ProPositionDistribution.vue'

definePageMeta({ proTab: { feature: 'search-console', label: 'Insights', icon: 'i-lucide-sparkles', order: 40 } })

const { siteId, siteStatus, gscdumpSiteId } = useSite('Insights')
const { period, stableData } = useSitePeriod()
const { fetchGscdump } = useProGscdump()

const dateRange = computed(() => periodToDateRange(toValue(period), toValue(stableData)))
const queryEnabled = computed(() => !!gscdumpSiteId.value)

// Hosted v1/server operations own capability checks. The retired browser
// layer's source-info probe is deliberately no longer part of this consumer.
function gate(_analyzerId: string) {
  return queryEnabled
}

// Position Distribution
interface PosDistPoint { date: string, pos_1_3: number, pos_4_10: number, pos_11_20: number, pos_20_plus: number, total: number }
const posDistQuery = useGscQuery<{ distribution: PosDistPoint[] }>({
  site: gscdumpSiteId,
  enabled: gate('position-distribution'),
  params: computed(() => ({ type: 'position-distribution' as const, startDate: dateRange.value.start, endDate: dateRange.value.end })),
  reshape: (raw: AnalysisResult) => ({ distribution: (raw.results ?? []) as unknown as PosDistPoint[] }),
  serverFallback: (id: string) => fetchGscdump<{ distribution: PosDistPoint[] }>(`/sites/${id}/position-distribution`, {
    query: { startDate: dateRange.value.start, endDate: dateRange.value.end },
    silent: true,
  }),
})
useTrackGscEngine(posDistQuery)
const posDistribution = posDistQuery.data
const posDistStatus = computed(() => posDistQuery.pending.value ? 'pending' : posDistQuery.error.value ? 'error' : 'success')

// Device Gap: desktop vs mobile CTR/position gap
interface DeviceGapSummary { avgCtrGap: number, avgPositionGap: number, ctrGapTrend: string, positionGapTrend: string }
const deviceGapQuery = useGscQuery<{ summary: DeviceGapSummary | null }>({
  site: gscdumpSiteId,
  enabled: gate('device-gap'),
  params: computed(() => ({ type: 'device-gap' as const, startDate: dateRange.value.start, endDate: dateRange.value.end })),
  reshape: (raw: AnalysisResult) => ({ summary: ((raw.meta ?? {}) as { summary?: DeviceGapSummary }).summary ?? null }),
  serverFallback: (id: string) => fetchGscdump<{ summary: DeviceGapSummary | null }>(`/sites/${id}/device-gap`, {
    query: { startDate: dateRange.value.start, endDate: dateRange.value.end },
    silent: true,
  }),
})
useTrackGscEngine(deviceGapQuery)
const deviceGap = deviceGapQuery.data

// CTR Curve
interface CtrBucket { bucket: string, avgCtr: number, medianPosition: number, keywordCount: number, totalClicks: number, totalImpressions: number }
interface CtrOutlier { query: string, clicks: number, impressions: number, ctr: number, position: number, expectedCtr: number, ctrDiff: number }
const ctrQuery = useGscQuery<{ curve: CtrBucket[], overperforming: CtrOutlier[], underperforming: CtrOutlier[] }>({
  site: gscdumpSiteId,
  enabled: gate('ctr-curve'),
  params: computed(() => ({ type: 'ctr-curve' as const, startDate: dateRange.value.start, endDate: dateRange.value.end })),
  reshape: (raw: AnalysisResult) => {
    const meta = (raw.meta ?? {}) as { overperforming?: CtrOutlier[], underperforming?: CtrOutlier[] }
    return {
      curve: (raw.results ?? []) as unknown as CtrBucket[],
      overperforming: meta.overperforming ?? [],
      underperforming: meta.underperforming ?? [],
    }
  },
  serverFallback: (id: string) => fetchGscdump<{ curve: CtrBucket[], overperforming: CtrOutlier[], underperforming: CtrOutlier[] }>(
    `/sites/${id}/ctr-curve`,
    { query: { startDate: dateRange.value.start, endDate: dateRange.value.end }, silent: true },
  ),
})
useTrackGscEngine(ctrQuery)
const ctrData = ctrQuery.data
const ctrStatus = computed(() => ctrQuery.pending.value ? 'pending' : ctrQuery.error.value ? 'error' : 'success')

// Dark Traffic
interface DarkSummary { totalClicks: number, attributedClicks: number, darkClicks: number, darkPercent: number }
interface DarkPage { url: string, totalClicks: number, attributedClicks: number, darkClicks: number, darkPercent: number, keywordCount: number }
const darkQuery = useGscQuery<{ summary: DarkSummary, pages: DarkPage[] }>({
  site: gscdumpSiteId,
  enabled: gate('dark-traffic'),
  params: computed(() => ({ type: 'dark-traffic' as const, startDate: dateRange.value.start, endDate: dateRange.value.end })),
  reshape: (raw: AnalysisResult) => {
    const meta = (raw.meta ?? {}) as { summary?: DarkSummary }
    return {
      summary: meta.summary ?? { totalClicks: 0, attributedClicks: 0, darkClicks: 0, darkPercent: 0 },
      pages: (raw.results ?? []) as unknown as DarkPage[],
    }
  },
  serverFallback: (id: string) => fetchGscdump<{ summary: DarkSummary, pages: DarkPage[] }>(
    `/sites/${id}/dark-traffic`,
    { query: { startDate: dateRange.value.start, endDate: dateRange.value.end }, silent: true },
  ),
})
useTrackGscEngine(darkQuery)
const darkData = darkQuery.data
const darkStatus = computed(() => darkQuery.pending.value ? 'pending' : darkQuery.error.value ? 'error' : 'success')

// Content Velocity
interface VelocityWeek { week: string, newKeywords: number, totalKeywords: number }
interface VelocitySummary { totalNewKeywords: number, avgPerWeek: number, trend: string }
const velocityQuery = useGscQuery<{ weekly: VelocityWeek[], summary: VelocitySummary }>({
  site: gscdumpSiteId,
  enabled: gate('content-velocity'),
  params: computed(() => ({ type: 'content-velocity' as const })),
  reshape: (raw: AnalysisResult) => {
    const meta = (raw.meta ?? {}) as { summary?: VelocitySummary }
    return {
      weekly: (raw.results ?? []) as unknown as VelocityWeek[],
      summary: meta.summary ?? { totalNewKeywords: 0, avgPerWeek: 0, trend: 'stable' },
    }
  },
  serverFallback: (id: string) => fetchGscdump<{ weekly: VelocityWeek[], summary: VelocitySummary }>(
    `/sites/${id}/content-velocity`,
    { silent: true },
  ),
})
useTrackGscEngine(velocityQuery)
const velocityData = velocityQuery.data
const velocityStatus = computed(() => velocityQuery.pending.value ? 'pending' : velocityQuery.error.value ? 'error' : 'success')

// Keyword Breadth
interface BreadthBucket { bucket: string, pageCount: number }
interface BreadthPage { url: string, keywordCount: number, clicks: number, impressions: number }
interface BreadthSummary { totalPages: number, avgKeywordsPerPage: number, fragileCount: number, authorityCount: number }
const breadthQuery = useGscQuery<{ distribution: BreadthBucket[], fragilePages: BreadthPage[], authorityPages: BreadthPage[], summary: BreadthSummary }>({
  site: gscdumpSiteId,
  enabled: gate('keyword-breadth'),
  params: computed(() => ({ type: 'keyword-breadth' as const, startDate: dateRange.value.start, endDate: dateRange.value.end })),
  reshape: (raw: AnalysisResult) => {
    const meta = (raw.meta ?? {}) as { fragilePages?: BreadthPage[], authorityPages?: BreadthPage[], summary?: BreadthSummary }
    return {
      distribution: (raw.results ?? []) as unknown as BreadthBucket[],
      fragilePages: meta.fragilePages ?? [],
      authorityPages: meta.authorityPages ?? [],
      summary: meta.summary ?? { totalPages: 0, avgKeywordsPerPage: 0, fragileCount: 0, authorityCount: 0 },
    }
  },
  serverFallback: (id: string) => fetchGscdump<{ distribution: BreadthBucket[], fragilePages: BreadthPage[], authorityPages: BreadthPage[], summary: BreadthSummary }>(
    `/sites/${id}/keyword-breadth`,
    { query: { startDate: dateRange.value.start, endDate: dateRange.value.end }, silent: true },
  ),
})
useTrackGscEngine(breadthQuery)
const breadthData = breadthQuery.data
const breadthStatus = computed(() => breadthQuery.pending.value ? 'pending' : breadthQuery.error.value ? 'error' : 'success')

// Canonical Mismatches
interface Mismatch { url: string, userCanonical: string, googleCanonical: string, verdict: string | null }
interface ConsolidationTarget { google_canonical: string, count: number }
interface CanonicalData { mismatches: Mismatch[], totalCount: number, consolidationTargets: ConsolidationTarget[] }
const { data: canonicalData, status: canonicalStatus } = useAsyncData(
  computed(() => `canonicals:${gscdumpSiteId.value}`),
  async () => {
    if (!gscdumpSiteId.value)
      return null
    return fetchGscdump<CanonicalData>(`/sites/${gscdumpSiteId.value}/canonical-mismatches`, { silent: true })
  },
  { server: false, watch: [gscdumpSiteId] },
)

const hydrated = ref(false)
onMounted(() => {
  hydrated.value = true
})

const fmtPct = (n: number | undefined) => n != null ? `${(n * 100).toFixed(1)}%` : '-'

const trendColors: Record<string, { text: string, label: string }> = {
  accelerating: { text: 'text-success', label: 'Accelerating' },
  stable: { text: 'text-muted', label: 'Stable' },
  decelerating: { text: 'text-error', label: 'Decelerating' },
}

// Velocity chart accessors
const velX = (_: VelocityWeek, i: number) => i
const velY = (d: VelocityWeek) => d.newKeywords ?? 0
function velTemplate(d: VelocityWeek) {
  return `<div class="text-[13px] tabular-nums"><div class="font-medium text-default">${d.week}</div><div>${d.newKeywords} new keywords</div><div class="text-muted">${d.totalKeywords} total active</div></div>`
}
</script>

<template>
  <div>
    <Alert
      v-if="siteStatus === 'error'"
      color="error"
      title="Failed to load site data."
    />

    <template v-else>
      <ProContextualTip page-key="search-console-insights" class="mb-4" />

      <!-- Position Distribution -->
      <ProPageZone tier="primary" first>
        <Card v-if="posDistribution?.distribution?.length || (hydrated && posDistStatus === 'pending')">
          <template #header>
            <ProSectionHeader title="Position Distribution" class="!mb-0">
              <template #after-title>
                <UiTooltip
                  title="Position Distribution"
                  description="Shows how your keywords are spread across Google search positions over time. Positions 1 to 3 get the majority of clicks. Track this to see if your rankings are improving or declining overall."
                  size="lg"
                />
              </template>
              <template #action>
                <div class="flex items-center gap-3 text-[11px]">
                  <UiTooltip title="Positions 1-3" description="The top 3 organic results. These positions capture roughly 55 to 70% of all clicks for a query.">
                    <DotLabel :dot-class="positionDistColors.top3.dot" label="1-3" class="cursor-help" />
                  </UiTooltip>
                  <UiTooltip title="Positions 4-10" description="The rest of page 1. These positions get meaningful click volume, but significantly less than the top 3.">
                    <DotLabel :dot-class="positionDistColors.page1.dot" label="4-10" class="cursor-help" />
                  </UiTooltip>
                  <UiTooltip title="Positions 11-20" description="Page 2 of search results. Very few users scroll this far. These keywords are close to page 1 and are good optimisation candidates.">
                    <DotLabel :dot-class="positionDistColors.page2.dot" label="11-20" class="cursor-help" />
                  </UiTooltip>
                  <UiTooltip title="Positions 20+" description="Deep in search results. These keywords bring almost no traffic but show Google considers your content relevant to the topic.">
                    <DotLabel :dot-class="positionDistColors.deep.dot" label="20+" class="cursor-help" />
                  </UiTooltip>
                </div>
              </template>
            </ProSectionHeader>
          </template>
          <ProPositionDistribution
            :data="posDistribution?.distribution || []"
            :loading="posDistStatus === 'pending'"
            :height="180"
          />
        </Card>

        <!-- Device Gap -->
        <div v-if="deviceGap?.summary">
          <ProSectionHeader
            title="Device Gap"
            icon="i-lucide-smartphone"
            icon-class="text-dimmed"
          />
          <div class="grid grid-cols-2 gap-3 mt-2">
            <MetricCard
              label="CTR Gap"
              :value="`${((deviceGap.summary.avgCtrGap ?? 0) * 100).toFixed(2)}%`"
            />
            <MetricCard
              label="Position Gap"
              :value="Math.abs(deviceGap.summary.avgPositionGap ?? 0).toFixed(1)"
            />
          </div>
        </div>

        <!-- CTR Performance -->
        <Card title="CTR Performance vs Expected" description="Your site's actual CTR by position bucket. Keywords above or below your average are optimization opportunities.">
          <template v-if="hydrated && ctrStatus === 'pending'">
            <UiSkeleton :lines="5" :base="200" :range="80" />
          </template>
          <template v-else-if="ctrData?.curve?.length">
            <!-- Curve -->
            <div class="space-y-1.5 mb-6">
              <div class="flex items-center gap-3 px-2.5 mb-1 text-[11px] text-dimmed">
                <span class="w-10">
                  <UiTooltip label="Pos" title="Position Bucket" description="Google search result positions grouped into ranges. Position 1 is the first organic result." />
                </span>
                <span class="flex-1">
                  <UiTooltip label="CTR Bar" title="Click-Through Rate" description="Percentage of impressions that resulted in a click. Higher bars mean more people click your result at that position." />
                </span>
                <span class="w-16 text-right">CTR</span>
                <span class="w-20 text-right">Keywords</span>
              </div>
              <div
                v-for="b in ctrData.curve"
                :key="b.bucket"
                class="flex items-center gap-3 py-1 px-2.5 rounded-lg hover:bg-[var(--ui-bg-accented)]/50 transition-colors"
              >
                <span class="text-sm font-medium w-10 tabular-nums">#{{ b.bucket }}</span>
                <div class="flex-1 h-2 rounded-full bg-[var(--ui-bg-muted)]/50 overflow-hidden">
                  <div class="h-full rounded-full" :class="vizDotColor.blue" :style="{ width: `${Math.min(b.avgCtr * 100 * 3, 100)}%` }" />
                </div>
                <span class="text-sm tabular-nums w-16 text-right">{{ fmtPct(b.avgCtr) }}</span>
                <span class="text-[13px] text-dimmed tabular-nums w-20 text-right">{{ formatNumber(b.keywordCount) }} kw</span>
              </div>
            </div>

            <!-- Outliers -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataList
                v-if="ctrData.overperforming?.length"
                title="Overperforming"
                tooltip="Keywords with CTR significantly above your site's average for their position. Study these titles and snippets to replicate what works."
                :items="ctrData.overperforming.slice(0, 8)"
              >
                <template #default="{ item }">
                  <span class="text-sm truncate max-w-[160px]">{{ item.query }}</span>
                  <div class="flex items-center gap-2 text-[13px] tabular-nums">
                    <UiTooltip :text="`Actual CTR: **${fmtPct(item.ctr)}** — this keyword gets **${fmtPct(item.ctr - item.expectedCtr)}** more clicks than expected at position ${Math.round(item.position)}.`">
                      <span class="text-success cursor-help">{{ fmtPct(item.ctr) }}</span>
                    </UiTooltip>
                    <span class="text-dimmed">exp {{ fmtPct(item.expectedCtr) }}</span>
                  </div>
                </template>
              </DataList>

              <DataList
                v-if="ctrData.underperforming?.length"
                title="Underperforming"
                tooltip="Keywords with CTR below your site's average. These are your best optimisation targets: improving the title or description can increase clicks without changing rankings."
                :items="ctrData.underperforming.slice(0, 8)"
              >
                <template #default="{ item }">
                  <span class="text-sm truncate max-w-[160px]">{{ item.query }}</span>
                  <div class="flex items-center gap-2 text-[13px] tabular-nums">
                    <UiTooltip :text="`Actual CTR: **${fmtPct(item.ctr)}** — this keyword gets **${fmtPct(item.expectedCtr - item.ctr)}** fewer clicks than expected at position ${Math.round(item.position)}.`">
                      <span class="text-error cursor-help">{{ fmtPct(item.ctr) }}</span>
                    </UiTooltip>
                    <span class="text-dimmed">exp {{ fmtPct(item.expectedCtr) }}</span>
                  </div>
                </template>
              </DataList>
            </div>

            <ProEducationPanel
              class="mt-6"
              what="Click-Through Rate (CTR) measures what percentage of people who see your result in Google actually click it. This chart compares your CTR at each position to your site's own average, revealing which keywords attract more or fewer clicks than expected."
              why="Two pages can rank at the same position but get very different click volumes. A compelling title and meta description can double your traffic without improving rankings. Identifying over and underperformers lets you replicate what works and fix what doesn't."
              :actions="[
                'Study overperforming titles and descriptions, then apply similar patterns to underperformers',
                'Add structured data (FAQ, How-to, Review) to boost rich snippet visibility for underperforming queries',
                'Rewrite meta descriptions for high-impression, low-CTR keywords to include clearer value propositions',
              ]"
              color="blue"
            />
          </template>
          <EmptyState v-else icon="i-lucide-mouse-pointer-click" title="No CTR data" description="Not enough keyword data to calculate CTR curves." />
        </Card>

        <!-- Dark Traffic -->
        <Card title="Hidden Keyword Traffic" description="Google hides ~46% of keyword data. This shows clicks not attributed to any known keyword.">
          <template v-if="hydrated && darkStatus === 'pending'">
            <UiSkeleton :lines="4" :base="180" :range="80" />
          </template>
          <template v-else-if="darkData?.summary">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <MetricCard
                label="Total Clicks"
                :value="formatNumber(darkData.summary.totalClicks)"
              />
              <MetricCard
                label="Attributed"
                :value="formatNumber(darkData.summary.attributedClicks)"
              />
              <MetricCard
                label="Hidden"
                :value="formatNumber(darkData.summary.darkClicks)"
              />
              <MetricCard
                label="Hidden %"
                :value="fmtPct(darkData.summary.darkPercent)"
              />
            </div>

            <DataList
              v-if="darkData.pages?.length"
              title="Pages with Most Hidden Traffic"
              tooltip="Pages where total clicks significantly exceed clicks from known keywords. These pages likely rank for many long-tail queries that Google doesn't report individually."
              :items="darkData.pages.slice(0, 10)"
            >
              <template #default="{ item }">
                <a :href="item.url" target="_blank" rel="noopener" class="text-sm truncate max-w-[240px] hover:text-primary transition-colors">
                  {{ getPath(item.url) }}
                </a>
                <div class="flex items-center gap-3 text-[13px] tabular-nums">
                  <span class="text-warning">{{ formatNumber(item.darkClicks) }} hidden</span>
                  <span class="text-dimmed">{{ fmtPct(item.darkPercent) }}</span>
                </div>
              </template>
            </DataList>

            <ProEducationPanel
              class="mt-6"
              what="Google Search Console only reports keyword data for queries with enough search volume. The rest appears as anonymous clicks. 'Dark traffic' is the gap between your total clicks and clicks attributed to known keywords."
              why="If 60%+ of a page's traffic is hidden, you may be underestimating its SEO value. Pages with high dark traffic often rank for hundreds of long-tail variations that individually have low volume but collectively drive significant traffic."
              :actions="[
                'Check pages with high dark traffic in Google Analytics to identify landing page patterns',
                'Use these pages as content hubs, they likely already have topical authority for related queries',
                'Avoid deprioritising pages just because Search Console shows low keyword counts',
              ]"
              color="amber"
            />
          </template>
          <EmptyState v-else icon="i-lucide-eye-off" title="No traffic data" description="Traffic data will appear once sync is complete." />
        </Card>
      </ProPageZone>

      <ProPageZone tier="secondary">
        <!-- Content Velocity + Keyword Breadth side by side -->
        <ProSecondaryGrid layout="equal">
          <!-- Content Velocity -->
          <Card>
            <template #header>
              <ProSectionHeader title="Content Velocity" class="!mb-0">
                <template #after-title>
                  <UiTooltip
                    title="Content Velocity"
                    description="Tracks how many new keywords your site starts ranking for each week. An accelerating trend means Google is discovering and indexing your content faster. A decelerating trend may signal stale content or indexing issues."
                    size="lg"
                  />
                </template>
                <template #action>
                  <div v-if="velocityData?.summary" class="text-right">
                    <UiTooltip :text="`Your site gains an average of **${velocityData.summary.avgPerWeek} new keywords per week**. Trend: **${velocityData.summary.trend}**.`">
                      <span class="text-base font-semibold tabular-nums cursor-help">{{ velocityData.summary.avgPerWeek }}/wk</span>
                    </UiTooltip>
                    <div class="text-[11px]" :class="trendColors[velocityData.summary.trend]?.text">
                      {{ trendColors[velocityData.summary.trend]?.label }}
                    </div>
                  </div>
                </template>
              </ProSectionHeader>
            </template>

            <template v-if="hydrated && velocityStatus === 'pending'">
              <UiSkeleton :lines="3" :base="160" :range="60" />
            </template>
            <template v-else-if="velocityData?.weekly?.length">
              <ClientOnly>
                <VisXYContainer :data="velocityData.weekly" :height="160">
                  <VisLine :x="velX" :y="velY" :color="vizColorMap.green!.hex" :line-width="2" :curve-type="CurveType.MonotoneX" />
                  <VisAxis type="x" :tick-format="(i: number) => velocityData!.weekly[i]?.week?.slice(-3) ?? ''" :num-ticks="6" />
                  <VisAxis type="y" />
                  <VisCrosshair :template="velTemplate" />
                  <VisTooltip />
                </VisXYContainer>
                <template #fallback>
                  <UiSkeleton :lines="3" :base="160" :range="60" />
                </template>
              </ClientOnly>
            </template>
            <EmptyState v-else icon="i-lucide-rocket" title="Not enough data" description="Need more history to calculate velocity." />
          </Card>

          <!-- Keyword Breadth -->
          <Card>
            <template #header>
              <ProSectionHeader title="Keyword Breadth" class="!mb-0">
                <template #after-title>
                  <UiTooltip
                    title="Keyword Breadth"
                    description="Shows how many different keywords each page ranks for. Pages ranking for only 1 or 2 keywords are 'fragile' (one ranking drop loses all traffic). Pages ranking for 20+ keywords are 'authority' pages with strong topical coverage."
                    size="lg"
                  />
                </template>
                <template #action>
                  <div v-if="breadthData?.summary" class="text-right">
                    <UiTooltip :text="`Your pages rank for an average of **${breadthData.summary.avgKeywordsPerPage} keywords each** across **${breadthData.summary.totalPages} pages**.`">
                      <span class="text-base font-semibold tabular-nums cursor-help">{{ breadthData.summary.avgKeywordsPerPage }} avg</span>
                    </UiTooltip>
                    <div class="text-[11px] text-dimmed">
                      {{ breadthData.summary.totalPages }} pages
                    </div>
                  </div>
                </template>
              </ProSectionHeader>
            </template>

            <template v-if="hydrated && breadthStatus === 'pending'">
              <UiSkeleton :lines="3" :base="160" :range="60" />
            </template>
            <template v-else-if="breadthData?.distribution?.length">
              <!-- Bar distribution -->
              <div class="flex items-end gap-2 mb-4">
                <div
                  v-for="d in breadthData.distribution"
                  :key="d.bucket"
                  class="flex-1 flex flex-col items-center gap-1"
                >
                  <span class="text-[11px] tabular-nums text-muted">{{ d.pageCount }}</span>
                  <div
                    class="w-full rounded-t" :class="breadthVizColor.bg"
                    :style="{ height: `${Math.max(Math.round((d.pageCount / Math.max(...breadthData.distribution.map((x: BreadthBucket) => x.pageCount))) * 48), 4)}px` }"
                  />
                  <span class="text-[10px] text-dimmed">{{ d.bucket }}</span>
                </div>
              </div>

              <!-- Fragile + Authority counts -->
              <div class="grid grid-cols-2 gap-3">
                <MetricCard
                  label="Fragile (1-2 kw)"
                  :value="String(breadthData.summary?.fragileCount ?? 0)"
                />
                <MetricCard
                  label="Authority (20+ kw)"
                  :value="String(breadthData.summary?.authorityCount ?? 0)"
                />
              </div>
            </template>
            <EmptyState v-else icon="i-lucide-layers" title="No breadth data" description="Page-keyword data will appear once sync is complete." />
          </Card>
        </ProSecondaryGrid>
        <!-- Canonical Mismatches -->
        <Card title="Canonical Mismatches" description="URLs where Google chose a different canonical than you specified. These silently redirect ranking signals away from your preferred pages.">
          <template v-if="hydrated && canonicalStatus === 'pending'">
            <UiSkeleton :lines="4" :base="180" :range="80" />
          </template>
          <template v-else-if="canonicalData?.totalCount">
            <div class="grid grid-cols-2 gap-3 mb-6">
              <MetricCard
                label="Mismatches"
                :value="formatNumber(canonicalData.totalCount)"
              />
              <MetricCard
                label="Consolidation Targets"
                :value="String(canonicalData.consolidationTargets?.length || 0)"
              />
            </div>

            <DataList
              v-if="canonicalData.consolidationTargets?.length"
              title="Google's Chosen Canonicals"
              tooltip="The canonical URLs Google is consolidating your pages to. When Google picks a different canonical, your specified URL won't appear in search results. High counts may indicate duplicate or near-duplicate content that needs to be differentiated or properly redirected."
              :items="canonicalData.consolidationTargets.slice(0, 8)"
              class="mb-6"
            >
              <template #default="{ item }">
                <a :href="item.google_canonical" target="_blank" rel="noopener" class="text-sm truncate max-w-[240px] hover:text-primary transition-colors">
                  {{ getPath(item.google_canonical) }}
                </a>
                <span class="text-sm tabular-nums text-muted">{{ item.count }} pages</span>
              </template>
            </DataList>

            <DataList
              v-if="canonicalData.mismatches?.length"
              title="Affected URLs"
              tooltip="Individual URLs where your canonical tag differs from Google's choice. The arrow shows your canonical → Google's chosen canonical. PASS means Google respects your choice; FAIL means it overrode you."
              :items="canonicalData.mismatches.slice(0, 8)"
            >
              <template #default="{ item }">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <a :href="item.url" target="_blank" rel="noopener" class="text-sm truncate hover:text-primary transition-colors">
                    {{ getPath(item.url) }}
                  </a>
                  <div class="flex items-center gap-1.5 text-[11px] text-dimmed">
                    <span class="truncate max-w-[120px]">{{ getPath(item.userCanonical) }}</span>
                    <UIcon name="i-lucide-arrow-right" class="size-2.5 shrink-0" />
                    <span class="truncate max-w-[120px] text-warning">{{ getPath(item.googleCanonical) }}</span>
                  </div>
                </div>
                <ProStatusBadge
                  :status="item.verdict === 'PASS' ? 'success' : item.verdict === 'FAIL' ? 'error' : 'neutral'"
                  :label="item.verdict || '—'"
                  size="sm"
                />
              </template>
            </DataList>

            <ProEducationPanel
              class="mt-6"
              what="A canonical URL tells Google which version of a page you consider the 'original'. When Google disagrees and picks a different canonical, your preferred URL won't appear in search results, and ranking signals (links, engagement) may be attributed to the wrong page."
              why="Canonical mismatches silently dilute your SEO efforts. If Google consolidates three of your pages into one canonical, only that one page can rank. The others become invisible in search, even if they have unique content. Fixing mismatches ensures your best pages get full credit."
              :actions="[
                'For true duplicates, set up 301 redirects to the preferred URL instead of relying on canonical tags alone',
                'For near-duplicates, differentiate the content so Google sees them as genuinely distinct pages',
                'Check that your canonical tags use absolute URLs and match the URL structure Google prefers (trailing slashes, www vs non-www)',
              ]"
              color="amber"
            />
          </template>
          <EmptyState v-else icon="i-lucide-link-2" title="No canonical mismatches" description="No URLs found where Google's canonical differs from yours. Requires URL inspection data." />
        </Card>

        <!-- AI Prompt CTA -->
        <Card>
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div class="size-10 rounded-lg flex items-center justify-center bg-accented shrink-0">
              <UIcon name="i-lucide-sparkles" class="size-5 text-muted" />
            </div>
            <div class="flex-1">
              <h3 class="text-[13px] font-semibold tracking-tight text-default">
                Act on these insights
              </h3>
              <p class="text-[13px] text-muted">
                Use AI-powered prompts to generate content briefs, fix underperforming keywords, or expand fragile pages.
              </p>
            </div>
            <div class="flex gap-2 shrink-0">
              <UButton size="sm" variant="subtle" icon="i-lucide-search" :to="`/pro/dashboard/sites/${siteId}/ai/prompt`">
                Keyword Prompt
              </UButton>
              <UButton size="sm" variant="subtle" icon="i-lucide-file-search" :to="`/pro/dashboard/sites/${siteId}/ai/prompt/page`">
                Page Prompt
              </UButton>
            </div>
          </div>
        </Card>
      </ProPageZone>
    </template>
  </div>
</template>

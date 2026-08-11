<script setup lang="ts">
import type { AnalysisResult } from '@gscdump/engine/analysis-types'
import type { BuilderState, GscdumpDataDetailResponse, Period } from '#layers/pro-gsc/shared/public'
import { eq, page, queryCanonical } from 'gscdump/query'
import { useProGscdump } from '#layers/pro-gsc/app/composables/useProGscdump'
import { useTrackGscEngine } from '../../composables/useGscEngineStats'
import { useGscQuery } from '../../composables/useGscQuery'

const props = defineProps<{
  gscdumpSiteId: string | null | undefined
  type: 'page' | 'keyword'
  identifier: string
  period?: Period
  width?: number
  height?: number
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'neutral'
}>()

const isVisible = ref(false)
const container = useTemplateRef<HTMLElement>('container')

// Build query state for trend data
const trendState = computed<BuilderState>(() => {
  const range = periodToDateRange(props.period ?? '28d')
  const filterColumn = props.type === 'page' ? page : queryCanonical
  return {
    dimensions: ['date'],
    filter: andFilter(
      dateFilter(range),
      eq(filterColumn, props.identifier),
    ),
    orderBy: { column: 'date', dir: 'asc' },
  }
})

const gscdump = useProGscdump()

const trendQuery = useGscQuery<GscdumpDataDetailResponse>({
  site: computed(() => props.gscdumpSiteId ?? undefined),
  enabled: computed(() => isVisible.value && !!props.gscdumpSiteId),
  params: computed(() => ({ type: 'data-detail' as const, q: trendState.value })),
  reshape: (raw: AnalysisResult) => {
    const meta = (raw.meta ?? {}) as Record<string, unknown>
    return {
      daily: (raw.results ?? []) as unknown as GscdumpDataDetailResponse['daily'],
      totals: (meta.totals as GscdumpDataDetailResponse['totals'] | undefined) ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      meta: meta as unknown as GscdumpDataDetailResponse['meta'],
    }
  },
  serverFallback: (id: string) => gscdump.queryAnalyticsReportDetail({
    params: { siteId: id },
    body: { state: trendState.value },
  }, true),
})

useTrackGscEngine(trendQuery)
const data = trendQuery.data
const status = computed(() => trendQuery.pending.value ? 'pending' : trendQuery.error.value ? 'error' : trendQuery.data.value ? 'success' : 'idle')

// Intersection observer to trigger load
onMounted(() => {
  if (!container.value)
    return

  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !isVisible.value)
      isVisible.value = true
  }, { rootMargin: '100px' })

  observer.observe(container.value)

  onUnmounted(() => observer.disconnect())
})

const clicksData = computed(() => {
  if (!data.value?.daily)
    return []
  return data.value.daily.map(d => d.clicks || 0)
})

const sparklineSummary = computed(() => {
  if (!clicksData.value.length)
    return ''
  const total = clicksData.value.reduce((s, n) => s + n, 0)
  const first = clicksData.value[0] ?? 0
  const last = clicksData.value.at(-1) ?? 0
  const direction = last > first ? 'trending up' : last < first ? 'trending down' : 'flat'
  return `Clicks over last ${props.period ?? '28d'}: ${total} total, ${direction}`
})
</script>

<template>
  <div ref="container" class="inline-flex items-center" role="img" :aria-label="sparklineSummary || undefined">
    <div v-if="status === 'pending'" class="animate-pulse" aria-busy="true">
      <div
        class="bg-accented rounded"
        :style="{ width: `${width || 80}px`, height: `${height || 28}px` }"
      />
    </div>
    <UiSparkline
      v-else-if="clicksData.length > 1"
      :data="clicksData"
      :width="width || 80"
      :height="height || 28"
      :color="color || 'blue'"
      aria-hidden="true"
    />
    <span v-else class="text-[10px] text-dimmed" aria-label="No trend data">—</span>
  </div>
</template>

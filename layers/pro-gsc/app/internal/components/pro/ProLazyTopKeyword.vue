<script setup lang="ts">
import type { AnalysisResult } from '@gscdump/engine/analysis-types'
import type { BuilderState } from 'gscdump/query'
import { eq, page } from 'gscdump/query'
import { logWarn } from '~~/shared/logging'
import { NuxtLink } from '#components'
import { useProAnalyzeWithFallback, useProGscdump } from '#layers/pro-gsc/app/composables/useProGscdump'
import ProPositionMetric from '../../../components/pro/ProPositionMetric.vue'

const props = defineProps<{
  gscdumpSiteId: string
  page: string
  siteId: string
  startDate: string
  endDate: string
}>()

const container = useTemplateRef<HTMLElement>('container')
const result = ref<{ keyword: string, position?: number } | null>(null)
const loaded = ref(false)

const { getTopAssociation } = useProGscdump()
const _analyzeWithFallback = useProAnalyzeWithFallback()

onMounted(() => {
  if (!container.value)
    return

  const observer = new IntersectionObserver((entries) => {
    if (entries[0]?.isIntersecting && !loaded.value) {
      loaded.value = true
      observer.disconnect()
      const range = { start: props.startDate, end: props.endDate }
      const state: BuilderState = {
        dimensions: ['query'],
        filter: andFilter(
          dateFilter(range),
          eq(page, props.page),
        ),
        orderBy: { column: 'clicks', dir: 'desc' },
        rowLimit: 1,
      }
      _analyzeWithFallback<{ value: string | null }>(
        props.gscdumpSiteId,
        { type: 'data-query', q: state },
        (raw: AnalysisResult) => {
          const top = (raw.results ?? [])[0] as { query?: string } | undefined
          return { value: top?.query ?? null }
        },
        () => getTopAssociation({
          params: { siteId: props.gscdumpSiteId },
          query: {
            type: 'topKeyword',
            identifier: props.page,
            startDate: props.startDate,
            endDate: props.endDate,
          },
        }, true),
      )
        .then((r) => {
          if (r.value)
            result.value = { keyword: r.value }
        })
        .catch(err => logWarn('dashboard.section_fetch_failed', err, { section: 'top-keyword', siteId: props.siteId, page: props.page }))
    }
  }, { rootMargin: '100px' })

  observer.observe(container.value)
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div ref="container">
    <div v-if="result" class="flex items-center gap-2">
      <ProPositionMetric v-if="result.position" :value="result.position" />
      <NuxtLink
        :to="`/pro/dashboard/sites/${siteId}/search-console/queries/${encodeURIComponent(result.keyword)}`"
        :title="result.keyword"
        class="max-w-[140px] truncate text-sm text-muted hover:text-primary transition-colors"
      >
        {{ result.keyword }}
      </NuxtLink>
    </div>
    <span v-else-if="loaded" class="text-dimmed">—</span>
  </div>
</template>

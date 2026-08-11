<script setup lang="ts">
import type { AnalysisResult } from '@gscdump/engine/analysis-types'
import type { BuilderState } from 'gscdump/query'
import { eq, query } from 'gscdump/query'
import { logWarn } from '~~/shared/logging'
import { NuxtLink } from '#components'
import { useProAnalyzeWithFallback, useProGscdump } from '#layers/pro-gsc/app/composables/useProGscdump'

const props = defineProps<{
  gscdumpSiteId: string
  keyword: string
  siteId: string
  startDate: string
  endDate: string
}>()

const container = useTemplateRef<HTMLElement>('container')
const result = ref<string | null>(null)
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
        dimensions: ['page'],
        filter: andFilter(
          dateFilter(range),
          eq(query, props.keyword),
        ),
        orderBy: { column: 'clicks', dir: 'desc' },
        rowLimit: 1,
      }
      _analyzeWithFallback<{ value: string | null }>(
        props.gscdumpSiteId,
        { type: 'data-query', q: state },
        (raw: AnalysisResult) => {
          const top = (raw.results ?? [])[0] as { page?: string } | undefined
          return { value: top?.page ?? null }
        },
        () => getTopAssociation({
          params: { siteId: props.gscdumpSiteId },
          query: {
            type: 'topPage',
            identifier: props.keyword,
            startDate: props.startDate,
            endDate: props.endDate,
          },
        }, true),
      )
        .then((r) => {
          if (r.value)
            result.value = r.value
        })
        .catch(err => logWarn('dashboard.section_fetch_failed', err, { section: 'top-page', siteId: props.siteId, keyword: props.keyword }))
    }
  }, { rootMargin: '100px' })

  observer.observe(container.value)
  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <div ref="container">
    <NuxtLink
      v-if="result"
      :to="`/pro/dashboard/sites/${siteId}/search-console/pages/${encodeURIComponent(result)}`"
      :title="result"
      class="max-w-[120px] truncate text-sm text-muted hover:text-primary transition-colors"
    >
      {{ getPath(result) }}
    </NuxtLink>
    <span v-else-if="loaded" class="text-dimmed">—</span>
  </div>
</template>

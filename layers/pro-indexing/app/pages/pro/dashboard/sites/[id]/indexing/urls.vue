<script lang="ts" setup>
import TableIndexingUrls from '#layers/pro-indexing/app/internal/components/TableIndexingUrls.vue'
import { issueDetails } from '#layers/pro-indexing/app/utils/indexing-issues'
import { INDEXING_URLS_PAGE_SIZE } from '#layers/pro-indexing/app/utils/indexing-urls-first-page'

definePageMeta({ proTab: { feature: 'indexing', label: 'URLs', icon: 'i-lucide-link-2', order: 30 } })

const { gscdumpSiteId } = useSite('Indexing URLs')
const route = useRoute()

const initialIssue = computed(() => {
  const issue = route.query.issue
  return typeof issue === 'string' && issueDetails[issue] ? issue : undefined
})
const initialSearch = computed(() =>
  typeof route.query.search === 'string' ? route.query.search : undefined,
)
const initialFacet = computed(() => {
  const facet = route.query.facet
  return facet === 'canonical_mismatch' || facet === 'rich_results' ? facet : undefined
})
const initialStatus = computed<'indexed' | 'not_indexed' | 'pending' | undefined>(() => {
  const status = route.query.status
  return status === 'indexed' || status === 'not_indexed' || status === 'pending' ? status : undefined
})
</script>

<template>
  <ProPageStates>
    <TableIndexingUrls
      :key="`urls-${initialIssue}-${initialFacet}`"
      :gscdump-site-id="gscdumpSiteId"
      :page-size="INDEXING_URLS_PAGE_SIZE"
      :initial-issue="initialIssue"
      :initial-search="initialSearch"
      :initial-facet="initialFacet"
      :initial-status="initialStatus"
    />
  </ProPageStates>
</template>

<script lang="ts" setup>
import { useProGscdumpIndexingDiagnostics } from '#layers/pro-gsc/app/composables/useProGscdump'

/**
 * Indexing, Recovery. The page behind the quality-rejection verdict.
 *
 * It answers one question: which pages is Google refusing, and are they worth
 * keeping. The counts name the scale and each one deep-links the URLs it came
 * from. The work itself is the reader's, so this page diagnoses and never
 * prescribes.
 */

definePageMeta({ proTab: { feature: 'indexing', label: 'Recovery', icon: 'i-lucide-life-buoy', order: 10 } })

const { siteId, gscdumpSiteId } = useSite('Indexing recovery')

const { data: diagnostics, status } = useProGscdumpIndexingDiagnostics(
  computed(() => gscdumpSiteId.value ?? ''),
)

/**
 * The rejection buckets, in the order they explain each other: Google fetched
 * these and refused, Google found these and never fetched, Google got an empty
 * page. Only buckets Search Console actually reports are rendered.
 */
const REJECTION_LABELS: Record<string, string> = {
  crawled_not_indexed: 'Crawled, then refused',
  discovered_not_indexed: 'Found, never fetched',
  soft_404: 'Served as empty',
}

const buckets = computed(() => {
  const issues = diagnostics.value?.issues ?? []
  return Object.keys(REJECTION_LABELS)
    .map((type) => {
      const issue = issues.find(i => i.type === type)
      return issue && issue.count > 0
        ? { type, label: REJECTION_LABELS[type] as string, count: issue.count }
        : null
    })
    .filter(bucket => bucket !== null)
})

const totalRejected = computed(() => buckets.value.reduce((sum, bucket) => sum + bucket.count, 0))
</script>

<template>
  <ProPageStates>
    <ProPageZone tier="primary" first>
      <UiAlert
        v-if="status === 'success' && totalRejected === 0"
        status="success"
        title="Google is not refusing pages on this site"
        description="Search Console reports no pages in the crawled-not-indexed, discovered-not-indexed, or soft-404 buckets."
      />

      <UiCard v-else-if="buckets.length" title="Pages Google is refusing" size="sm">
        <div class="grid gap-4 sm:grid-cols-3">
          <UiStat
            v-for="bucket in buckets"
            :key="bucket.type"
            :title="bucket.label"
            :value="bucket.count"
            :to="`/pro/dashboard/sites/${siteId}/indexing/urls?issue=${bucket.type}`"
            card
            size="sm"
          />
        </div>
        <p class="mt-3 text-mini text-dimmed">
          Counts come from the latest Search Console sync. Google re-evaluates a
          refusal on its own schedule, so expect movement over weeks.
        </p>
        <!--
          nuxtseo.com also renders `ProSiteQualityRejectionClusters` here, which
          groups the refused URLs by path pattern and tags the prunable sets. It
          reads `/api/pro/sites/:id/quality-rejection-clusters`, and there is no
          gscdump v1 operation behind that computation, so the panel is absent
          rather than filled with invented data.
        -->
      </UiCard>

      <UiCard v-else size="sm">
        <UiSkeleton :lines="3" :base="220" :range="60" />
      </UiCard>
    </ProPageZone>
  </ProPageStates>
</template>

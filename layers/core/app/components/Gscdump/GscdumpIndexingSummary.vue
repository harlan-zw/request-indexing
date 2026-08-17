<script lang="ts" setup>
import { indexingVizColors } from '~~/layers/design-system/composables/proDataVizColors'

const props = defineProps<{
  siteId: string
}>()

const { data, status, error, refresh } = useGscdumpIndexing(() => props.siteId)

const summary = computed(() => data.value?.summary ?? null)
const trend = computed(() => data.value?.trend ?? [])

const trendGraph = computed(() => trend.value.map(point => ({
  date: point.date,
  clicks: point.indexedCount,
  impressions: point.totalUrls,
})))

// A single day plots as an invisible one-point line, which read as a broken
// chart on sites whose stats had loaded fine. Two points are the minimum.
const canPlotTrend = computed(() => trendGraph.value.length >= 2)

const trendColors = {
  clicks: indexingVizColors.indexed.hex,
  impressions: indexingVizColors.notIndexed.hex,
}

const trendLabels = {
  clicks: 'Indexed URLs',
  impressions: 'Total URLs',
}

const lastTrend = computed(() => trend.value.at(-1))

// A green bar under "68.2%" told the reader coverage was healthy when a third
// of the site is missing from the index.
const indexedTone = computed<'success' | 'warning' | 'error'>(() => {
  const percent = summary.value?.indexedPercent ?? 0
  if (percent >= 90)
    return 'success'
  if (percent >= 70)
    return 'warning'
  return 'error'
})

const indexedToneText = computed(() => ({
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
}[indexedTone.value]))

// `Soft404` read as one word because the split only fired on a letter-to-letter
// case change, never on a letter-to-digit boundary.
function humanizeKey(key: string | number) {
  return String(key)
    .replace(/([A-Z])/g, ' $1')
    .replace(/([a-z])(\d)/gi, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
}

interface CountRow { label: string, count: number }

function toRows(counts?: Record<string, number | null> | null): CountRow[] {
  if (!counts)
    return []
  return Object.entries(counts).map(([key, count]) => ({ label: humanizeKey(key), count: Number(count) || 0 }))
}

// Six rows of `0` used to eat a third of every site block. Only the counts that
// carry a number are listed; an all-zero group collapses to one line.
const issueRows = computed(() => toRows(lastTrend.value?.issues))
const coverageRows = computed(() => toRows(lastTrend.value?.coverage))
const openIssues = computed(() => issueRows.value.filter(row => row.count > 0))
const openCoverage = computed(() => coverageRows.value.filter(row => row.count > 0))
</script>

<template>
  <AsyncCardState
    :status="status"
    :error="error"
    :empty="!summary"
    label="indexing data"
    empty-message="No URLs have been inspected for this site yet."
    min-height="min-h-40"
    :rows="4"
    @retry="refresh()"
  >
    <div v-if="summary">
      <!-- Four `text-2xl` numbers side by side overflowed a 390px viewport.
           They stack two-up until there is room for the row. -->
      <div class="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
          <div class="text-xs text-muted">
            Total URLs
          </div>
          <div class="text-2xl font-mono font-bold tabular-nums text-highlighted">
            {{ useHumanFriendlyNumber(summary.totalUrls) }}
          </div>
        </UCard>
        <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
          <div class="text-xs text-muted">
            Indexed
          </div>
          <div class="text-2xl font-mono font-bold tabular-nums text-success">
            {{ useHumanFriendlyNumber(summary.indexed) }}
          </div>
        </UCard>
        <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
          <div class="text-xs text-muted">
            Not Indexed
          </div>
          <div class="text-2xl font-mono font-bold tabular-nums text-error">
            {{ useHumanFriendlyNumber(summary.notIndexed) }}
          </div>
        </UCard>
        <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
          <div class="text-xs text-muted">
            Indexed %
          </div>
          <div class="text-2xl font-mono font-bold tabular-nums" :class="indexedToneText">
            {{ formatPercentMetric(summary.indexedPercent) }}
          </div>
          <UProgress :model-value="summary.indexedPercent" :color="indexedTone" size="xs" class="mt-1" />
        </UCard>
      </div>

      <!-- Both windows always render. Dropping the row when a value is missing
           made the same block look different from site to site, and the number
           carried no unit. -->
      <div class="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2">
        <div>
          <span class="text-xs text-muted">Indexed URLs, last 7 days:</span>
          <span v-if="summary.change7d != null" class="text-sm font-mono ml-1 tabular-nums" :class="summary.change7d >= 0 ? 'text-success' : 'text-error'">
            {{ summary.change7d > 0 ? '+' : '' }}{{ summary.change7d }} URLs
          </span>
          <span v-else class="text-sm ml-1 text-dimmed">Not enough history</span>
        </div>
        <div>
          <span class="text-xs text-muted">Indexed URLs, last 28 days:</span>
          <span v-if="summary.change28d != null" class="text-sm font-mono ml-1 tabular-nums" :class="summary.change28d >= 0 ? 'text-success' : 'text-error'">
            {{ summary.change28d > 0 ? '+' : '' }}{{ summary.change28d }} URLs
          </span>
          <span v-else class="text-sm ml-1 text-dimmed">Not enough history</span>
        </div>
      </div>

      <div class="mb-6">
        <div class="text-xs text-muted mb-2">
          Indexing Trend
        </div>
        <GraphDataNext
          v-if="canPlotTrend"
          :height="120"
          :value="trendGraph"
          :columns="['clicks', 'impressions']"
          :colors="trendColors"
          :labels="trendLabels"
          description="Indexed URLs and total URLs over time"
        />
        <p v-else-if="lastTrend" class="text-sm text-muted">
          {{ useHumanFriendlyNumber(lastTrend.indexedCount ?? 0) }} of
          {{ useHumanFriendlyNumber(lastTrend.totalUrls) }} URLs indexed on {{ lastTrend.date }}.
          A trend needs at least two days of history.
        </p>
        <p v-else class="text-sm text-muted">
          No indexing history yet. The trend appears after the next sync.
        </p>
      </div>

      <div v-if="issueRows.length || coverageRows.length" class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div v-if="issueRows.length">
          <div class="text-xs text-muted mb-2 font-semibold">
            Issues
          </div>
          <div v-if="openIssues.length" class="space-y-1">
            <div v-for="row in openIssues" :key="row.label" class="flex justify-between text-xs">
              <span class="text-toned capitalize">{{ row.label }}</span>
              <span class="font-mono tabular-nums text-highlighted">{{ row.count }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted">
            No issues across {{ issueRows.length }} checks.
          </p>
        </div>
        <div v-if="coverageRows.length">
          <div class="text-xs text-muted mb-2 font-semibold">
            Coverage
          </div>
          <div v-if="openCoverage.length" class="space-y-1">
            <div v-for="row in openCoverage" :key="row.label" class="flex justify-between text-xs">
              <span class="text-toned capitalize">{{ row.label }}</span>
              <span class="font-mono tabular-nums text-highlighted">{{ row.count }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-muted">
            No URLs in any coverage state.
          </p>
        </div>
      </div>
    </div>
  </AsyncCardState>
</template>

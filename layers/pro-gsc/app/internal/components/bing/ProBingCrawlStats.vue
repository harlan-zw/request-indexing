<script setup lang="ts">
// Bing crawl activity: daily crawl volume, index size and error counts.
//
// Ported from nuxtseo.com `app/internal/components/bing/ProBingCrawlStats.vue`.
// Upstream reads a dedicated crawl endpoint on its Bing host; here the same
// numbers arrive as the `crawl` dataset of `partner.sites.bing.data.get`.
import type { BingDataV1 } from '@gscdump/contracts/v1/http'
import {
  UiAlert,
  UiLineChart,
  UiMetricStat,
  UiRelativeTime,
  UiSectionHeader,
  UiTogglePill,
} from '#components'
import { bingCrawlLatest, formatBingNumber, formatBingReportingDay } from '#layers/pro-gsc/app/utils/bing-view'

const { data } = defineProps<{ data: Extract<BingDataV1, { dataset: 'crawl' }> }>()

const latest = computed(() => bingCrawlLatest(data.rows))
const lastCollection = computed(() => data.sync._tag === 'missing' ? null : data.sync.observedAt)
const metric = ref<'crawledPages' | 'inIndex' | 'crawlErrors'>('crawledPages')
const metricOptions = [
  { label: 'Crawled Pages', value: 'crawledPages' as const },
  { label: 'In index', value: 'inIndex' as const },
  { label: 'Crawl errors', value: 'crawlErrors' as const },
]
const metricLabels = {
  crawledPages: 'Crawled Pages',
  inIndex: 'In index',
  crawlErrors: 'Crawl errors',
} as const
const series = computed(() => [{ key: metric.value, label: metricLabels[metric.value] }])
</script>

<template>
  <div class="flex flex-col gap-5" data-testid="bing-crawl-stats">
    <UiAlert
      v-if="data.sync._tag === 'unavailable'"
      status="warning"
      title="Bing crawl activity is delayed"
      description="The last successful collection stays visible while the next daily sync retries."
    />
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <UiSectionHeader
        title="Bing crawl activity"
        tooltip="Daily crawl volume, index size, links and response codes reported by Bing Webmaster Tools."
      />
      <div v-if="lastCollection" class="text-xs text-muted">
        Collected <UiRelativeTime :date="lastCollection" />
      </div>
    </div>
    <div v-if="latest" class="flex flex-wrap gap-x-6 gap-y-3 rounded-xl border border-default bg-elevated/30 px-4 py-3">
      <UiMetricStat :value="formatBingNumber(latest.crawledPages)" label="crawled Pages" />
      <UiMetricStat :value="formatBingNumber(latest.inIndex)" label="in index" />
      <UiMetricStat :value="formatBingNumber(latest.inLinks)" label="links" />
      <UiMetricStat :value="formatBingNumber(latest.crawlErrors)" label="crawl errors" />
      <UiMetricStat :value="formatBingNumber(latest.blockedByRobotsTxt)" label="blocked by robots.txt" />
    </div>
    <div class="rounded-xl border border-default bg-default p-4">
      <div class="mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <h3 class="text-sm font-semibold text-highlighted">
          Crawl activity over time
        </h3>
        <UiTogglePill v-model="metric" :options="metricOptions" label="Crawl measure" />
      </div>
      <UiLineChart
        :data="data.rows"
        x-key="date"
        :series="series"
        :height="180"
        :x-format="value => formatBingReportingDay(String(value))"
        :y-format="value => formatBingNumber(value)"
      />
    </div>
  </div>
</template>

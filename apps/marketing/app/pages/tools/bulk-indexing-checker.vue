<script setup lang="ts">
const faqs = [
  {
    question: 'How many URLs can I check at once?',
    answer: 'You can check up to 50 URLs at once, either by pasting them directly or by providing a sitemap URL. The tool will parse your sitemap and check each URL\'s indexing status.',
  },
  {
    question: 'Why are most of my pages not indexed?',
    answer: 'According to a study of 16 million pages by IndexCheckr, 61.94% of pages are not indexed by Google. Common causes include low content quality, duplicate content, thin pages, crawl budget limitations on large sites, and low domain authority.',
  },
  {
    question: 'How do I submit all unindexed URLs to Google?',
    answer: 'You can use Google\'s Indexing API to submit up to 200 URLs per day. The API supports batch requests of up to 100 URLs per HTTP call. Request Indexing makes this easy with a one-click interface — just connect your Google Search Console and submit.',
  },
  {
    question: 'Is there a limit to indexing requests per day?',
    answer: 'Google Search Console\'s "Request Indexing" button is limited to 10-15 URLs per day. The Indexing API has a quota of 200 publish requests per day per project, with batch requests counting each URL individually. The getMetadata endpoint allows 180 requests per minute.',
  },
  {
    question: 'How long does bulk indexing take?',
    answer: 'Natural indexing averages 27.4 days per page. Using the Google Indexing API can reduce this to hours for many pages. However, Google still applies quality filters — the API notifies Google to prioritize crawling, but doesn\'t guarantee indexing.',
  },
]

useToolSeo({
  title: 'Bulk Indexing Checker — Audit Your Site\'s Index Coverage',
  description: 'Check indexing status for up to 50 URLs at once. Paste URLs or provide your sitemap to audit Google index coverage in bulk. Free, no signup required.',
  faqs,
})

type InputMode = 'urls' | 'sitemap'

const inputMode = ref<InputMode>('urls')
const urlsInput = ref('')
const sitemapInput = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<{
  summary: { total: number, indexed: number, notIndexed: number, indexRate: number }
  results: Array<{ url: string, indexed: boolean, matchedUrl?: string, matchedTitle?: string }>
  checkedAt: string
} | null>(null)

const sortBy = ref<'url' | 'status'>('status')

const sortedResults = computed(() => {
  if (!result.value)
    return []
  const items = [...result.value.results]
  if (sortBy.value === 'status')
    items.sort((a, b) => Number(a.indexed) - Number(b.indexed))
  else
    items.sort((a, b) => a.url.localeCompare(b.url))
  return items
})

function runCheck() {
  loading.value = true
  error.value = null
  result.value = null

  const body: Record<string, any> = {}

  if (inputMode.value === 'sitemap') {
    if (!sitemapInput.value.trim())
      return
    body.sitemapUrl = sitemapInput.value.trim()
  }
  else {
    const urls = urlsInput.value
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean)
    if (urls.length === 0)
      return
    body.urls = urls
  }

  $fetch('/api/tools/bulk-check', {
    method: 'POST',
    body,
  })
    .then((data) => {
      result.value = data
    })
    .catch((err) => {
      error.value = err.data?.message || err.message || 'Failed to check URLs'
    })
    .finally(() => {
      loading.value = false
    })
}

function exportCsv() {
  if (!result.value)
    return
  const header = 'URL,Status,Matched URL\n'
  const rows = result.value.results
    .map(r => `"${r.url}","${r.indexed ? 'Indexed' : 'Not Indexed'}","${r.matchedUrl || ''}"`)
    .join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `indexing-check-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <ToolsToolPageLayout color-scheme="blue">
    <!-- Hero -->
    <div class="text-center mb-10">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-[var(--ui-text-highlighted)] mb-3" style="letter-spacing: -2px;">
        Bulk Indexing
        <span class="text-blue-600 dark:text-blue-400">Checker</span>
      </h1>
      <p class="text-base sm:text-lg text-[var(--ui-text-muted)] max-w-xl mx-auto">
        Check indexing status for up to 50 URLs at once. Paste a list or provide your sitemap URL.
      </p>
    </div>

    <!-- Input -->
    <ToolsToolInputGlow :loading="loading" color-scheme="blue">
      <form class="space-y-4" @submit.prevent="runCheck">
        <!-- Mode Toggle -->
        <div class="flex items-center gap-2">
          <span class="text-xs text-[var(--ui-text-muted)] font-medium">Input:</span>
          <div class="inline-flex rounded-lg border border-[var(--ui-border)] p-0.5 bg-[var(--ui-bg-elevated)]">
            <button
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              :class="inputMode === 'urls'
                ? 'bg-white dark:bg-neutral-700 text-[var(--ui-text-highlighted)] shadow-sm'
                : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)]'"
              @click="inputMode = 'urls'"
            >
              Paste URLs
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              :class="inputMode === 'sitemap'
                ? 'bg-white dark:bg-neutral-700 text-[var(--ui-text-highlighted)] shadow-sm'
                : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text-highlighted)]'"
              @click="inputMode = 'sitemap'"
            >
              Sitemap URL
            </button>
          </div>
        </div>

        <!-- URL List -->
        <div v-if="inputMode === 'urls'">
          <UTextarea
            v-model="urlsInput"
            placeholder="Paste URLs, one per line (max 50)&#10;&#10;https://example.com/page-1&#10;https://example.com/page-2&#10;https://example.com/page-3"
            :rows="6"
            :disabled="loading"
          />
          <p class="text-xs text-[var(--ui-text-dimmed)] mt-1">
            {{ urlsInput.split('\n').filter(u => u.trim()).length }} URLs entered (max 50)
          </p>
        </div>

        <!-- Sitemap URL -->
        <div v-else>
          <UInput
            v-model="sitemapInput"
            placeholder="Enter sitemap URL (e.g., https://example.com/sitemap.xml)"
            size="lg"
            icon="i-heroicons-map"
            :disabled="loading"
          />
          <p class="text-xs text-[var(--ui-text-dimmed)] mt-1">
            First 50 URLs from the sitemap will be checked
          </p>
        </div>

        <UButton
          type="submit"
          size="lg"
          class="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white"
          :disabled="loading || (inputMode === 'urls' ? !urlsInput.trim() : !sitemapInput.trim())"
          :loading="loading"
        >
          Check {{ inputMode === 'sitemap' ? 'Sitemap' : 'URLs' }}
        </UButton>
      </form>
    </ToolsToolInputGlow>

    <!-- Error -->
    <ToolsToolError :error="error" />

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <UIcon name="i-heroicons-arrow-path" class="size-4 text-blue-500 animate-spin" />
        <span class="text-sm text-blue-700 dark:text-blue-300">Checking URLs... This may take a moment.</span>
      </div>
    </div>

    <!-- Results -->
    <div v-if="result" class="max-w-4xl">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] text-center">
          <div class="text-2xl font-bold text-[var(--ui-text-highlighted)]">
            {{ result.summary.total }}
          </div>
          <div class="text-xs text-[var(--ui-text-muted)]">
            Total URLs
          </div>
        </div>
        <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center">
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {{ result.summary.indexed }}
          </div>
          <div class="text-xs text-[var(--ui-text-muted)]">
            Indexed
          </div>
        </div>
        <div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ result.summary.notIndexed }}
          </div>
          <div class="text-xs text-[var(--ui-text-muted)]">
            Not Indexed
          </div>
        </div>
        <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ result.summary.indexRate }}%
          </div>
          <div class="text-xs text-[var(--ui-text-muted)]">
            Index Rate
          </div>
        </div>
      </div>

      <!-- Index Rate Bar -->
      <div class="mb-6 p-4 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-[var(--ui-text-highlighted)]">Index Coverage</span>
          <span class="text-sm text-[var(--ui-text-muted)]">{{ result.summary.indexRate }}% indexed</span>
        </div>
        <div class="h-3 rounded-full overflow-hidden flex bg-red-200 dark:bg-red-900/40">
          <div
            class="bg-emerald-500 rounded-full transition-all duration-500"
            :style="{ width: `${result.summary.indexRate}%` }"
          />
        </div>
        <p v-if="result.summary.indexRate < 50" class="text-xs text-[var(--ui-text-muted)] mt-2">
          Benchmark: only 37% of pages achieve full indexing across 16M pages studied (IndexCheckr).
        </p>
      </div>

      <!-- Results Table -->
      <div class="rounded-xl border border-[var(--ui-border)] overflow-hidden mb-6">
        <div class="flex items-center justify-between px-4 py-3 bg-[var(--ui-bg-elevated)] border-b border-[var(--ui-border)]">
          <div class="flex items-center gap-3">
            <span class="text-sm font-semibold text-[var(--ui-text-highlighted)]">Results</span>
            <div class="inline-flex rounded-md border border-[var(--ui-border)] p-0.5 text-xs">
              <button
                class="px-2 py-1 rounded transition-colors"
                :class="sortBy === 'status' ? 'bg-[var(--ui-bg)] shadow-sm font-medium' : 'text-[var(--ui-text-muted)]'"
                @click="sortBy = 'status'"
              >
                By Status
              </button>
              <button
                class="px-2 py-1 rounded transition-colors"
                :class="sortBy === 'url' ? 'bg-[var(--ui-bg)] shadow-sm font-medium' : 'text-[var(--ui-text-muted)]'"
                @click="sortBy = 'url'"
              >
                By URL
              </button>
            </div>
          </div>
          <UButton size="xs" variant="ghost" color="neutral" icon="i-heroicons-arrow-down-tray" @click="exportCsv">
            CSV
          </UButton>
        </div>
        <div class="divide-y divide-[var(--ui-border)] max-h-[500px] overflow-y-auto">
          <div
            v-for="item in sortedResults"
            :key="item.url"
            class="flex items-center gap-3 px-4 py-3 text-sm hover:bg-[var(--ui-bg-elevated)]/50 transition-colors"
          >
            <UIcon
              :name="item.indexed ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
              class="size-4 shrink-0"
              :class="item.indexed ? 'text-emerald-500' : 'text-red-500'"
            />
            <span class="flex-1 truncate font-mono text-xs text-[var(--ui-text-muted)]">
              {{ item.url }}
            </span>
            <ToolsToolStatusBadge :status="item.indexed ? 'indexed' : 'not-indexed'" />
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div v-if="result.summary.notIndexed > 0" class="p-6 rounded-xl bg-gradient-to-br from-primary-50 to-emerald-50 dark:from-primary-900/20 dark:to-emerald-900/20 border border-primary-200 dark:border-primary-800">
        <div class="flex items-start gap-4">
          <UIcon name="i-heroicons-bolt" class="size-6 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-1">
              {{ result.summary.notIndexed }} pages need indexing
            </h3>
            <p class="text-sm text-[var(--ui-text-muted)] mb-3">
              Submit your unindexed pages directly to Google's Indexing API. The API can process 200 URLs per day with batch requests of up to 100.
            </p>
            <UButton to="/get-started" color="primary" trailing-icon="i-heroicons-arrow-right">
              Submit to Google Now
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!result && !loading && !error" class="text-center py-12 text-[var(--ui-text-muted)]">
      <UIcon name="i-heroicons-queue-list" class="size-12 mx-auto mb-3 opacity-30" />
      <p>Paste URLs or enter a sitemap to check bulk indexing status</p>
    </div>

    <!-- FAQ -->
    <ToolsToolFaq :faqs="faqs" color="blue" />

    <!-- Related -->
    <div class="mt-12 text-center">
      <h3 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-4">
        More Indexing Tools
      </h3>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton to="/tools/google-indexing-checker" variant="ghost" size="sm">
          <UIcon name="i-heroicons-magnifying-glass" class="size-4 mr-1" />
          Single URL Check
        </UButton>
        <UButton to="/tools/site-indexing-report" variant="ghost" size="sm">
          <UIcon name="i-heroicons-document-chart-bar" class="size-4 mr-1" />
          Site Report
        </UButton>
        <UButton to="/bulk-submit-urls-google-indexing-api" variant="ghost" size="sm">
          <UIcon name="i-heroicons-book-open" class="size-4 mr-1" />
          Bulk Submission Guide
        </UButton>
      </div>
    </div>
  </ToolsToolPageLayout>
</template>

<script setup lang="ts">
const faqs = [
  {
    question: 'How do I check if Google indexed my page?',
    answer: 'You can use the site: search operator (e.g., site:example.com/page), Google Search Console\'s URL Inspection tool, or this free checker. The site: operator shows if Google has the page in its index, while URL Inspection gives detailed coverage state information.',
  },
  {
    question: 'Why is my page not showing in Google?',
    answer: 'Common reasons include: the page is too new (average indexing takes 27.4 days), low content quality causing "Crawled - currently not indexed" status, robots.txt blocking crawlers, a noindex tag, duplicate content, or low domain authority. Use this checker to confirm, then follow our fix guides.',
  },
  {
    question: 'How long does Google take to index a new page?',
    answer: 'According to a study of 16 million pages by IndexCheckr, the average time to index is 27.4 days. High-authority sites may see indexing within hours, while new or low-authority sites can wait weeks or months. Using the Google Indexing API can reduce this to hours.',
  },
  {
    question: 'What\'s the difference between "Discovered" and "Crawled" not indexed?',
    answer: '"Discovered - currently not indexed" means Google knows your URL exists but hasn\'t crawled it yet, often due to crawl budget or low predicted quality. "Crawled - currently not indexed" means Google visited the page but decided not to index it — as Gary Illyes explained, this is often due to "dupe elimination" or "the general quality of the site."',
  },
  {
    question: 'How does this tool check indexing status?',
    answer: 'This tool uses the site: search operator via an API to check if Google has your URL in its search results. If your URL appears in the results, it\'s indexed. For more detailed status information (like "Discovered" vs "Crawled" not indexed), connect your Google Search Console account.',
  },
]

useToolSeo({
  title: 'Google Index Checker — Is Your Page Indexed?',
  description: 'Free tool to check if your URL is indexed by Google. Instantly verify your page appears in Google search results and get actionable recommendations to fix indexing issues.',
  faqs,
})

const urlInput = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const result = ref<{
  url: string
  indexed: boolean
  matchedUrl?: string
  matchedTitle?: string
  totalSiteResults?: number
  checkedAt: string
} | null>(null)

function checkIndex() {
  if (!urlInput.value.trim())
    return

  loading.value = true
  error.value = null
  result.value = null

  $fetch('/api/tools/check-index', {
    method: 'POST',
    body: { url: urlInput.value.trim() },
  })
    .then((data) => {
      result.value = data
    })
    .catch((err) => {
      error.value = err.data?.message || err.message || 'Failed to check indexing status'
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<template>
  <ToolsToolPageLayout color-scheme="emerald">
    <!-- Hero -->
    <div class="text-center mb-10">
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-[var(--ui-text-highlighted)] mb-3" style="letter-spacing: -2px;">
        Google Index
        <span class="text-primary">Checker</span>
      </h1>
      <p class="text-base sm:text-lg text-[var(--ui-text-muted)] max-w-xl mx-auto">
        Check if your page is indexed by Google. Enter a URL to verify it appears in search results.
      </p>
    </div>

    <!-- Input -->
    <ToolsToolInputGlow :loading="loading" color-scheme="emerald">
      <form class="space-y-4" @submit.prevent="checkIndex">
        <div class="flex flex-col sm:flex-row gap-3">
          <UInput
            v-model="urlInput"
            placeholder="Enter URL (e.g., example.com/page)"
            size="xl"
            class="flex-1"
            icon="i-heroicons-globe-alt"
            :disabled="loading"
          />
          <UButton
            type="submit"
            size="xl"
            color="primary"
            :disabled="!urlInput.trim() || loading"
            :loading="loading"
          >
            Check Index
          </UButton>
        </div>
      </form>
    </ToolsToolInputGlow>

    <!-- Error -->
    <ToolsToolError :error="error" />

    <!-- Loading -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
        <UIcon name="i-heroicons-arrow-path" class="size-4 text-emerald-500 animate-spin" />
        <span class="text-sm text-emerald-700 dark:text-emerald-300">Checking Google index...</span>
      </div>
    </div>

    <!-- Result -->
    <div v-if="result" class="max-w-4xl">
      <!-- Status Card -->
      <div
        class="rounded-xl border-2 p-6 mb-6"
        :class="result.indexed
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'"
      >
        <div class="flex items-start gap-4">
          <div
            class="p-3 rounded-xl"
            :class="result.indexed
              ? 'bg-emerald-100 dark:bg-emerald-900/40'
              : 'bg-red-100 dark:bg-red-900/40'"
          >
            <UIcon
              :name="result.indexed ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
              class="size-8"
              :class="result.indexed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h2
              class="text-2xl font-bold mb-1"
              :class="result.indexed
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-red-700 dark:text-red-300'"
            >
              {{ result.indexed ? 'Indexed' : 'Not Indexed' }}
            </h2>
            <p class="text-sm text-[var(--ui-text-muted)] font-mono truncate mb-2">
              {{ result.url }}
            </p>
            <div v-if="result.indexed && result.matchedTitle" class="mt-3 p-3 rounded-lg bg-white/60 dark:bg-neutral-800/60">
              <p class="text-sm font-medium text-[var(--ui-text-highlighted)]">
                {{ result.matchedTitle }}
              </p>
              <p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                {{ result.matchedUrl }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="grid sm:grid-cols-2 gap-4 mb-8">
        <template v-if="!result.indexed">
          <UCard>
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-bolt" class="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Submit via Indexing API
                </h3>
                <p class="text-sm text-[var(--ui-text-muted)] mb-3">
                  Request Google to index this page now using the Indexing API. Average indexing time drops from weeks to hours.
                </p>
                <UButton to="/get-started" size="sm" color="primary">
                  Get Started Free
                </UButton>
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-book-open" class="size-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Learn Why Pages Aren't Indexed
                </h3>
                <p class="text-sm text-[var(--ui-text-muted)] mb-3">
                  Understand the common causes and fixes for indexing problems.
                </p>
                <UButton to="/google-indexing-api" size="sm" variant="outline" color="neutral">
                  Read Guide
                </UButton>
              </div>
            </div>
          </UCard>
        </template>
        <template v-else>
          <UCard>
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-queue-list" class="size-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Check More URLs
                </h3>
                <p class="text-sm text-[var(--ui-text-muted)] mb-3">
                  Audit your entire site's indexing status with our bulk checker.
                </p>
                <UButton to="/tools/bulk-indexing-checker" size="sm" variant="outline" color="neutral">
                  Bulk Check
                </UButton>
              </div>
            </div>
          </UCard>
          <UCard>
            <div class="flex items-start gap-3">
              <UIcon name="i-heroicons-document-chart-bar" class="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 class="font-semibold text-[var(--ui-text-highlighted)] mb-1">
                  Full Site Report
                </h3>
                <p class="text-sm text-[var(--ui-text-muted)] mb-3">
                  Get a complete indexing health report for your domain.
                </p>
                <UButton to="/tools/site-indexing-report" size="sm" variant="outline" color="neutral">
                  Site Report
                </UButton>
              </div>
            </div>
          </UCard>
        </template>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!result && !loading && !error" class="text-center py-12 text-[var(--ui-text-muted)]">
      <UIcon name="i-heroicons-magnifying-glass" class="size-12 mx-auto mb-3 opacity-30" />
      <p>Enter a URL to check if it's indexed by Google</p>
    </div>

    <!-- Educational Content -->
    <div class="max-w-4xl mt-12">
      <div class="p-6 rounded-xl bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)]">
        <h2 class="text-lg font-semibold text-[var(--ui-text-highlighted)] mb-4">
          How Google Indexing Works
        </h2>
        <div class="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 class="font-medium text-[var(--ui-text-highlighted)] mb-1">
              The Indexing Pipeline
            </h3>
            <ol class="list-decimal list-inside space-y-1 text-[var(--ui-text-muted)]">
              <li><strong>Discovery</strong> — Google finds your URL via sitemap or links</li>
              <li><strong>Pre-crawl scoring</strong> — Quality prediction before visiting</li>
              <li><strong>Crawl</strong> — Googlebot visits and renders your page</li>
              <li><strong>Post-crawl scoring</strong> — Content quality assessment</li>
              <li><strong>Indexation</strong> — Page added to serving index</li>
            </ol>
          </div>
          <div>
            <h3 class="font-medium text-[var(--ui-text-highlighted)] mb-1">
              Key Statistics
            </h3>
            <ul class="space-y-1 text-[var(--ui-text-muted)]">
              <li><strong>61.94%</strong> of pages are not indexed (IndexCheckr, 16M pages)</li>
              <li><strong>27.4 days</strong> average time to index</li>
              <li><strong>29.37%</strong> of submitted URLs end up indexed</li>
              <li><strong>21.29%</strong> deindexing rate for previously indexed pages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- FAQ -->
    <ToolsToolFaq :faqs="faqs" color="emerald" />

    <!-- Related -->
    <div class="mt-12 text-center">
      <h3 class="text-sm font-semibold text-[var(--ui-text-highlighted)] mb-4">
        More Indexing Tools
      </h3>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton to="/tools/bulk-indexing-checker" variant="ghost" size="sm">
          <UIcon name="i-heroicons-queue-list" class="size-4 mr-1" />
          Bulk Checker
        </UButton>
        <UButton to="/tools/site-indexing-report" variant="ghost" size="sm">
          <UIcon name="i-heroicons-document-chart-bar" class="size-4 mr-1" />
          Site Report
        </UButton>
        <UButton to="/guides" variant="ghost" size="sm">
          <UIcon name="i-heroicons-book-open" class="size-4 mr-1" />
          Indexing Guides
        </UButton>
      </div>
    </div>
  </ToolsToolPageLayout>
</template>

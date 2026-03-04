<script setup lang="ts">
useSeoMeta({
  title: 'Free Google Indexing Tools',
  description: 'Free tools to check if your pages are indexed by Google, audit your site\'s index coverage, and diagnose indexing problems. No signup required.',
})

defineOgImage('Home', {
  title: 'Free Google Indexing Tools',
  description: 'Check, audit, and fix your Google indexing',
})

useSchemaOrg([
  defineWebPage({
    '@type': 'CollectionPage',
    'name': 'Free Google Indexing Tools',
    'description': 'Free tools to check if your pages are indexed by Google, audit your site\'s index coverage, and diagnose indexing problems.',
  }),
])

const tools = [
  {
    title: 'Google Index Checker',
    description: 'Check if a specific URL is indexed by Google. Instantly see whether your page appears in Google\'s search results.',
    icon: 'i-heroicons-magnifying-glass',
    to: '/tools/google-indexing-checker',
    color: 'emerald',
    tags: ['Single URL', 'Instant Check', 'Free'],
  },
  {
    title: 'Bulk Indexing Checker',
    description: 'Check indexing status for up to 50 URLs at once. Paste a list or provide your sitemap URL to audit index coverage in bulk.',
    icon: 'i-heroicons-queue-list',
    to: '/tools/bulk-indexing-checker',
    color: 'blue',
    tags: ['Bulk Check', 'Sitemap Support', 'CSV Export'],
  },
  {
    title: 'Site Indexing Report',
    description: 'Get a full indexing health report for any domain. See estimated indexed pages, organic traffic, ranking keywords, and actionable recommendations.',
    icon: 'i-heroicons-document-chart-bar',
    to: '/tools/site-indexing-report',
    color: 'amber',
    tags: ['Domain Audit', 'Health Score', 'Recommendations'],
  },
]
</script>

<template>
  <div class="min-h-screen">
    <section class="relative pt-12 pb-8 lg:pt-16 lg:pb-12">
      <div class="max-w-4xl mx-auto px-6 text-center">
        <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] text-[var(--ui-text-highlighted)] mb-4" style="letter-spacing: -2px;">
          Indexing
          <span class="text-primary">Tools</span>
        </h1>
        <p class="text-lg text-[var(--ui-text-muted)] max-w-2xl mx-auto">
          Free tools to check, audit, and fix your Google indexing. No signup required.
        </p>
      </div>
    </section>

    <section class="px-4 sm:px-6 lg:px-8 pb-16">
      <div class="max-w-4xl mx-auto">
        <div class="grid gap-6">
          <NuxtLink
            v-for="tool in tools"
            :key="tool.to"
            :to="tool.to"
            class="group relative p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-[var(--ui-border)] transition-all hover:shadow-lg"
            :class="{
              'hover:border-emerald-300 dark:hover:border-emerald-700': tool.color === 'emerald',
              'hover:border-blue-300 dark:hover:border-blue-700': tool.color === 'blue',
              'hover:border-amber-300 dark:hover:border-amber-700': tool.color === 'amber',
            }"
          >
            <div class="flex items-start gap-4">
              <div
                class="p-3 rounded-xl"
                :class="{
                  'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400': tool.color === 'emerald',
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400': tool.color === 'blue',
                  'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400': tool.color === 'amber',
                }"
              >
                <UIcon :name="tool.icon" class="size-6" />
              </div>
              <div class="flex-1">
                <h2
                  class="text-xl font-semibold mb-2 transition-colors"
                  :class="{
                    'group-hover:text-emerald-600 dark:group-hover:text-emerald-400': tool.color === 'emerald',
                    'group-hover:text-blue-600 dark:group-hover:text-blue-400': tool.color === 'blue',
                    'group-hover:text-amber-600 dark:group-hover:text-amber-400': tool.color === 'amber',
                  }"
                >
                  {{ tool.title }}
                </h2>
                <p class="text-[var(--ui-text-muted)] mb-3">
                  {{ tool.description }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in tool.tags"
                    :key="tag"
                    class="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)]"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
              <UIcon
                name="i-heroicons-arrow-right"
                class="size-5 text-[var(--ui-text-dimmed)] group-hover:translate-x-1 transition-all"
                :class="{
                  'group-hover:text-emerald-500': tool.color === 'emerald',
                  'group-hover:text-blue-500': tool.color === 'blue',
                  'group-hover:text-amber-500': tool.color === 'amber',
                }"
              />
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <UPageSection :ui="{ container: 'max-w-4xl' }">
      <UPageCTA
        title="Need to fix indexing at scale?"
        description="Request Indexing submits your pages directly to Google's Indexing API. Free, open-source, and takes less than a minute to set up."
        variant="subtle"
        :links="[
          { label: 'Get Started Free', to: '/get-started', color: 'primary', size: 'xl', trailingIcon: 'i-heroicons-arrow-right' },
          { label: 'View Guides', to: '/guides', variant: 'ghost', color: 'neutral', size: 'xl' },
        ]"
      />
    </UPageSection>
  </div>
</template>

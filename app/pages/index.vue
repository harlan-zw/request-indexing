<script lang="ts" setup>
const { loggedIn, user } = useUserSession()

useSeoMeta({
  title: 'Request Indexing - Get Your Pages Indexed on Google Fast',
  description: 'Free, open-source tool to request Google indexing for your pages using the Indexing API. View Search Console data, track indexing status, and retain historical data.',
})

const faqItems = [
  {
    label: 'Does it actually work?',
    icon: 'i-heroicons-bolt',
    content: 'It does not guarantee to have all of your URLs indexed quicker, but it does, on average, speed up the process.',
  },
  {
    label: 'Will I be penalized for using this?',
    icon: 'i-heroicons-shield-check',
    content: 'Nope! These are public APIs managed by Google. We just make it easier to use them.',
  },
  {
    label: 'Can I see the code?',
    icon: 'i-heroicons-code-bracket',
    content: 'Sure! The entire project is open-source and available on GitHub under the GPL-3.0 license. Build your own version if you like.',
  },
]

const mockUrls = [
  { url: '/blog/getting-started', status: 'Submitted and indexed', verdict: 'pass', ago: '2 min ago' },
  { url: '/docs/configuration', status: 'Discovered - currently not indexed', verdict: 'neutral', ago: '5 min ago' },
  { url: '/guides/seo-best-practices', status: 'Submitted and indexed', verdict: 'pass', ago: '12 min ago' },
  { url: '/blog/hello-world', status: 'Crawled - currently not indexed', verdict: 'neutral', ago: '1 hr ago' },
  { url: '/changelog/v2', status: 'Submitted and indexed', verdict: 'pass', ago: '3 hrs ago' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <div class="dark:bg-neutral-950 gradient top-slice">
      <div class="dark:hidden gradient-after" />
      <UContainer class="z-1 relative max-w-8xl xl:max-w-[1400px]" :ui="{ container: 'max-w-8xl xl:max-w-[1335px]!' }">
        <section class="py-5 sm:py-12 xl:py-20">
          <div class="xl:grid gap-8 lg:gap-12 xl:grid-cols-12 mx-auto w-full sm:px-6 lg:px-0 px-0">
            <div class="text-pretty mx-auto max-w-[50rem] xl:col-span-7 xl:ml-0 mb-10 xl:mb-0 flex flex-col justify-center">
              <div>
                <div style="letter-spacing: -3px;" class="font-title font-bold leading-tight text-neutral-900 dark:text-neutral-100 text-center text-5xl sm:text-6xl lg:text-left mb-5">
                  <span>Get your pages <span class="underline">indexed</span>
                    <HeroSvg />
                    <span class="whitespace-nowrap">in 48 hours</span>.</span>
                </div>
              </div>
              <p class="text-neutral-700 dark:text-neutral-300 max-w-3xl text-center text-xl lg:text-left mb-8">
                A free, open-source tool to request pages to be indexed using the <NuxtLink to="https://developers.google.com/search/apis/indexing-api/v3/quickstart" target="_blank" class="font-semibold hover:underline text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">
                  Web Search Indexing API
                </NuxtLink> and view your Google Search Console data.
              </p>

              <div class="mb-10 flex items-center justify-center gap-3 flex-row sm:gap-6 lg:justify-start">
                <template v-if="!loggedIn">
                  <UButton to="/get-started" external size="xl" color="primary" trailing-icon="i-heroicons-arrow-right">
                    <span>Get Started<span class="hidden sm:inline"> Free</span></span>
                  </UButton>
                </template>
                <template v-else>
                  <UButton to="/dashboard" size="xl" color="primary">
                    <UAvatar :src="user.picture" size="xs" />
                    Dashboard
                  </UButton>
                </template>
                <UButton size="xl" variant="ghost" color="neutral" icon="i-simple-icons-github" target="_blank" to="https://github.com/harlan-zw/request-indexing">
                  View Code
                </UButton>
              </div>

              <!-- Quick features -->
              <div class="grid grid-cols-2 gap-5 mb-5 max-w-2xl mx-auto lg:mx-0 text-left">
                <div class="flex items-start gap-3">
                  <div>
                    <UIcon name="i-heroicons-bolt-solid" class="text-primary-500 w-6 h-6 mt-0.5" />
                  </div>
                  <div>
                    <div class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                      Request Indexing
                    </div>
                    <div class="text-sm text-neutral-600 dark:text-neutral-400">
                      Submit directly to Google's Indexing API.
                    </div>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div>
                    <UIcon name="i-heroicons-chart-bar-square-solid" class="text-primary-500 w-6 h-6 mt-0.5" />
                  </div>
                  <div>
                    <div class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                      Unified Dashboard
                    </div>
                    <div class="text-sm text-neutral-600 dark:text-neutral-400">
                      All your Search Console sites in one view.
                    </div>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div>
                    <UIcon name="i-heroicons-circle-stack-solid" class="text-primary-500 w-6 h-6 mt-0.5" />
                  </div>
                  <div>
                    <div class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                      Data Retention
                    </div>
                    <div class="text-sm text-neutral-600 dark:text-neutral-400">
                      Keep your historical insights forever.
                    </div>
                  </div>
                </div>
                <div class="flex items-start gap-3">
                  <div>
                    <UIcon name="i-heroicons-check-badge-solid" class="text-primary-500 w-6 h-6 mt-0.5" />
                  </div>
                  <div>
                    <div class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-0.5">
                      Open Source
                    </div>
                    <div class="text-sm text-neutral-600 dark:text-neutral-400">
                      Built by developers, for everyone.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Side Graphic / Dashboard Mock -->
            <div class="xl:col-span-5 max-w-full sticky top-10 flex items-center justify-center">
              <div class="w-full max-w-lg">
                <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl shadow-primary-500/10 overflow-hidden relative z-10">
                  <!-- Card header -->
                  <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-neutral-900">
                    <div class="flex items-center gap-2.5">
                      <img src="https://www.google.com/s2/favicons?domain=https://nuxtseo.com" alt="" class="size-4 rounded-sm">
                      <span class="font-semibold text-neutral-900 dark:text-neutral-100">nuxtseo.com</span>
                      <UBadge color="primary" variant="subtle" size="xs">
                        91% indexed
                      </UBadge>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="size-2 rounded-full bg-primary-400 animate-pulse" />
                      <span class="text-xs text-neutral-400">Live</span>
                    </div>
                  </div>
                  <!-- Mock URL rows -->
                  <div class="divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900">
                    <div
                      v-for="(item, i) in mockUrls"
                      :key="i"
                      class="px-5 py-3 flex items-center justify-between gap-4 text-sm group hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors animate-fade-in"
                      :style="{ animationDelay: `${i * 100}ms` }"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <UIcon
                          :name="item.verdict === 'pass' ? 'i-heroicons-check-circle' : 'i-heroicons-clock'"
                          class="size-4 shrink-0"
                          :class="item.verdict === 'pass' ? 'text-primary-500' : 'text-amber-400'"
                        />
                        <span class="truncate text-neutral-700 dark:text-neutral-300 font-mono text-xs">{{ item.url }}</span>
                      </div>
                      <span class="text-neutral-400 text-xs whitespace-nowrap hidden sm:block">{{ item.ago }}</span>
                    </div>
                  </div>
                  <!-- Card footer -->
                  <div class="px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                    <span class="text-xs text-neutral-400">5 of 119 pages</span>
                    <span class="text-xs text-primary-500 font-medium">3 indexed today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </UContainer>
    </div>

    <div class="bg-white dark:bg-neutral-900 pt-20">
      <!-- Features -->
      <UPageSection
        headline="Features"
        title="Everything you need for Google indexing"
        description="Stop waiting weeks for Google to discover your pages. Take control of your indexing with powerful tools and real-time insights."
        :ui="{ container: 'max-w-7xl', title: 'font-title' }"
      >
        <UPageGrid>
          <UPageCard
            title="Request Indexing"
            description="Submit your URLs directly to Google's Indexing API. New pages and updated content get indexed in hours, not weeks."
            icon="i-heroicons-bolt"
            spotlight
            spotlight-color="primary"
            variant="outline"
          />
          <UPageCard
            title="Unified Dashboard"
            description="All your Google Search Console sites in one view. See clicks, impressions, and indexing status across every property you manage."
            icon="i-heroicons-chart-bar-square"
            spotlight
            spotlight-color="primary"
            variant="outline"
          />
          <UPageCard
            title="Data Retention"
            description="Google deletes your Search Console data after 16 months. We keep it for as long as you need it, so you never lose historical insights."
            icon="i-heroicons-circle-stack"
            spotlight
            spotlight-color="primary"
            variant="outline"
          />
        </UPageGrid>
      </UPageSection>

      <!-- Learn Section -->
      <UPageSection
        headline="Learn"
        title="Master Google Indexing"
        description="Step-by-step guides to set up the Indexing API, submit URLs programmatically, and get your pages indexed faster."
        :ui="{ container: 'max-w-7xl', title: 'font-title' }"
      >
        <UPageGrid>
          <UPageCard
            title="Google Indexing API Guide"
            description="The complete guide to how the API works, authentication, quotas, error codes, and code examples in curl, TypeScript, and Python."
            icon="i-heroicons-book-open"
            to="/google-indexing-api"
            spotlight
            spotlight-color="primary"
            variant="outline"
          />
          <UPageCard
            title="Step-by-Step Tutorial"
            description="Set up your GCP project, create a service account, add it to Search Console, and make your first API call."
            icon="i-heroicons-academic-cap"
            to="/google-indexing-api-tutorial"
            spotlight
            spotlight-color="primary"
            variant="outline"
          />
          <UPageCard
            title="Node.js Implementation"
            description="Complete implementation guide with error handling, batch requests, retry logic, and production-ready patterns."
            icon="i-simple-icons-nodedotjs"
            to="/google-indexing-api-node-js"
            spotlight
            spotlight-color="primary"
            variant="outline"
          />
        </UPageGrid>
        <div class="flex justify-center mt-8">
          <UButton to="/guides" variant="ghost" color="neutral" trailing-icon="i-heroicons-arrow-right">
            View all guides
          </UButton>
        </div>
      </UPageSection>

      <!-- Data Retention Section -->
      <UPageSection
        orientation="horizontal"
        :ui="{ container: 'max-w-7xl', title: 'font-title' }"
        headline="Data Preservation"
        title="Google is deleting your data"
        description="Your Search Console data is permanently deleted after 16 months. Without historical data, you lose the ability to spot long-term trends, measure seasonal patterns, and make informed decisions."
        :features="[
          { title: 'Retain forever', description: 'Your data is kept for as long as you need it. Export anytime.', icon: 'i-heroicons-archive-box' },
          { title: 'Own your data', description: 'Export it, access it via an API, or delete it. It is yours.', icon: 'i-heroicons-finger-print' },
        ]"
      >
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-lg max-w-md mx-auto">
          <div class="flex items-start gap-3">
            <UIcon name="i-simple-icons-google" class="size-6 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p class="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed italic">
                "Search Console keeps data for the last 16 months. As a result, SEO reports in Analytics also include a maximum of 16 months of data."
              </p>
              <NuxtLink
                to="https://support.google.com/analytics/answer/1308621"
                target="_blank"
                class="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 mt-3 inline-block transition-colors"
              >
                - Google Analytics Documentation
              </NuxtLink>
            </div>
          </div>
        </div>
      </UPageSection>

      <!-- Trust Section -->
      <UPageSection
        headline="Open Source"
        title="Built by developers, for everyone"
        description="Request Indexing does not paywall you or expect you to know how to code. It is open, transparent, and yours."
        :ui="{ container: 'max-w-7xl', title: 'font-title' }"
      >
        <UPageGrid>
          <UPageCard
            title="Open Source"
            description="Released on GitHub under GPL-3.0. Built with Nuxt by a Nuxt core team member."
            icon="i-heroicons-check-badge"
            variant="subtle"
          />
          <UPageCard
            title="Private"
            description="We want as little of your data as possible to make a great tool. Delete your data at any time."
            icon="i-heroicons-eye-slash"
            variant="subtle"
          />
          <UPageCard
            title="Secure"
            description="Encryption at rest and in transit for all sensitive data. Secure hashes protect your identity."
            icon="i-heroicons-lock-closed"
            variant="subtle"
          />
        </UPageGrid>
      </UPageSection>

      <!-- FAQ -->
      <UPageSection
        title="Questions?"
        :ui="{ container: 'max-w-3xl', title: 'font-title' }"
      >
        <UAccordion :items="faqItems" multiple />
      </UPageSection>

      <!-- CTA -->
      <UPageSection :ui="{ container: 'max-w-4xl' }">
        <UPageCTA
          title="Start indexing your pages today"
          description="Free, open-source, and takes less than a minute to set up."
          variant="subtle"
          :links="[
            { label: 'Get Started Free', to: '/get-started', color: 'primary', size: 'xl', trailingIcon: 'i-heroicons-arrow-right' },
            { label: 'View on GitHub', to: 'https://github.com/harlan-zw/request-indexing', target: '_blank', variant: 'ghost', color: 'neutral', size: 'xl', icon: 'i-simple-icons-github' },
          ]"
        />
      </UPageSection>
    </div>
  </div>
</template>

<style>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.4s ease-out both;
}

@keyframes moveBackground {
  0%{background-position:0% 50%}
  50%{background-position:100% 50%}
  100%{background-position:0% 50%}
}
.gradient {
  position: relative;
  background-size: 400% 400%;
  animation: moveBackground 30s ease infinite;
  background-image: linear-gradient(47deg,
  var(--color-primary-50) 0%,
  #fae8ff 15%,
  var(--color-primary-50) 30%,
  #e0e7ff 45%,
  var(--color-primary-50) 60%,
  #ccfbf1 75%,
  var(--color-primary-50) 90%,
  #fae8ff 100%
  ) !important;
}

.gradient-after {
  width: 100%;
  height: 100%;
  position: absolute;
  background-size: 300% 300%;
  animation: moveBackground 10s ease infinite;
  background-image: linear-gradient(0deg,
  var(--color-primary-50) 0%,
  #fae8ff 15%,
  var(--color-primary-50) 30%,
  #e0e7ff 45%,
  var(--color-primary-50) 60%,
  #ccfbf1 75%,
  var(--color-primary-50) 90%,
  #fae8ff 100%
  ) !important;
  opacity: 0.5;
}

.dark .gradient {
  opacity: 0.1;
  background-color: transparent;
}

.dark .gradient-after {
  background-image: linear-gradient(0deg,
  #9c6e99 15%,
  #8089a6 45%,
  #669a8c 75%,
  #9c6e99 100%
  ) !important;
}

.top-slice {
  position: relative;
}
.top-slice:after {
  content: "";
  position: absolute;
  bottom: -70px;
  background-color: white;
  height: 140px;
  width: 120vw;
  left: -10px;
  transform: rotate(-2deg);
  z-index: 5;
}
.dark .top-slice:after {
  background-color: var(--color-neutral-900); /* neutral-900 to match background of the next section */
}
</style>

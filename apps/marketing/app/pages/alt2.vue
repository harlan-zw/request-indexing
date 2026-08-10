<script lang="ts" setup>
const { loggedIn, user } = useUserSession()

useSeoMeta({
  title: 'Request Indexing — Indexed by Google. Cited by ChatGPT.',
  description: 'Open-source Cloudflare Worker that submits every URL to Google and Bing, watches every AI crawler at the edge, tracks LLM citations across ChatGPT, Claude, Perplexity, Gemini, and keeps all of it past Google\'s 16-month wipe.',
})

const faqItems = [
  {
    label: 'Does it actually work?',
    icon: 'i-heroicons-bolt',
    content: 'Indexing API submissions, on average, speed Google up significantly. AI citations are not something anyone can guarantee — we surface the timeline so you can act on it.',
  },
  {
    label: 'Do I have to change my origin?',
    icon: 'i-heroicons-cube',
    content: 'No. Point a CNAME (or run the same Worker on your own Cloudflare account). The Worker sits in front of your origin and observes / injects / submits without touching your code.',
  },
  {
    label: 'Will I be penalized for using this?',
    icon: 'i-heroicons-shield-check',
    content: 'No. These are public APIs (Google Indexing, Bing IndexNow) and your own OAuth grants. No SERP scraping, no proxy rotation, no LLM context manipulation.',
  },
  {
    label: 'Can I see the code?',
    icon: 'i-heroicons-code-bracket',
    content: 'The whole engine is GPL-3.0 on GitHub. The hosted product is one deployment of it; self-host on your own Cloudflare with your own keys whenever you like.',
  },
]

// Live mock card: blend indexing wins with AI crawler / citation events.
const mockEvents = [
  { kind: 'index', icon: 'i-heroicons-check-circle', tone: 'pass', label: '/blog/getting-started', meta: 'Indexed · Google', ago: '2 min ago' },
  { kind: 'crawler', icon: 'i-simple-icons-openai', tone: 'crawler', label: '/docs/configuration', meta: 'GPTBot · 200', ago: '4 min ago' },
  { kind: 'citation', icon: 'i-heroicons-sparkles', tone: 'cite', label: 'Cited by Perplexity', meta: '"how to request indexing"', ago: '11 min ago' },
  { kind: 'crawler', icon: 'i-simple-icons-anthropic', tone: 'crawler', label: '/guides/seo-best-practices', meta: 'ClaudeBot · 200', ago: '22 min ago' },
  { kind: 'index', icon: 'i-heroicons-check-circle', tone: 'pass', label: '/changelog/v2', meta: 'Indexed · Bing IndexNow', ago: '1 hr ago' },
]

const walkthroughSteps = [
  {
    num: '01',
    eyebrow: 'Connect',
    title: 'Sign in with Google',
    description: 'One-click OAuth pulls in every verified Search Console property. Read-only, revocable any time. No plugin, no build step, no DNS change to start.',
    bullets: ['Read-only access to Search Console', 'Every site you own in one dashboard', 'Tokens encrypted at rest'],
  },
  {
    num: '02',
    eyebrow: 'Observe (optional edge mode)',
    title: 'See AI crawlers your analytics miss',
    description: 'Want to catch GPTBot, ClaudeBot, PerplexityBot before they hit your origin? Point a CNAME at our Cloudflare Worker. Skip this step if you only want Google + citations.',
    bullets: ['Six AI crawlers your analytics never saw', 'No origin changes, ~60s to first hit', 'Self-host the Worker on your own Cloudflare too'],
  },
  {
    num: '03',
    eyebrow: 'Submit',
    title: 'Push URLs to Google and Bing',
    description: 'Indexing API and IndexNow fire on the same deploy hook. Quota-aware, retry-aware, no babysitting.',
    bullets: ['Bulk submission within Google\'s 200/day cap', 'Bing IndexNow for everything else', 'Programmatic API for CI/CD pipelines'],
  },
  {
    num: '04',
    eyebrow: 'Retain',
    title: 'Indexed status + LLM citations, forever',
    description: 'We poll Google for indexing status and ask the five major LLMs about your topics daily. All of it stored past Google\'s 16-month window.',
    bullets: ['Daily citation runs across ChatGPT, Claude, Perplexity, Gemini, Copilot', 'GSC history retained as append-only Parquet on R2', 'One-command export — your data is yours'],
  },
]

const marketingTools = [
  {
    title: 'Google Index Checker',
    description: 'Instantly check if a single URL is indexed. No signup, no account.',
    icon: 'i-heroicons-magnifying-glass',
    to: '/tools/google-indexing-checker',
  },
  {
    title: 'Bulk Indexing Checker',
    description: 'Paste up to 50 URLs or a sitemap. Audit your coverage in one run and export CSV.',
    icon: 'i-heroicons-queue-list',
    to: '/tools/bulk-indexing-checker',
  },
  {
    title: 'Site Indexing Report',
    description: 'Full health report for any domain — estimated indexed pages, keyword coverage, recommendations.',
    icon: 'i-heroicons-document-chart-bar',
    to: '/tools/site-indexing-report',
  },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <div class="bg-verdant divider-tilt">
      <UContainer class="z-1 relative max-w-8xl xl:max-w-[1400px]" :ui="{ container: 'max-w-8xl xl:max-w-[1335px]!' }">
        <section class="py-5 sm:py-12 xl:py-20">
          <div class="xl:grid gap-8 lg:gap-12 xl:grid-cols-12 mx-auto w-full sm:px-6 lg:px-0 px-0">
            <div class="text-pretty mx-auto max-w-[50rem] xl:col-span-7 xl:ml-0 mb-10 xl:mb-0 flex flex-col justify-center">
              <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] mb-6 mx-auto lg:mx-0 self-center lg:self-start">
                <span class="size-1.5 rounded-full bg-primary animate-pulse" />
                Open source · Cloudflare-native
              </div>
              <h1 class="font-title font-bold leading-[0.98] tracking-[-0.045em] text-default text-center text-6xl sm:text-7xl lg:text-left lg:text-[5rem] xl:text-[6rem] mb-6">
                Get <span class="italic text-primary">indexed</span>
                <HeroSvg />
                <span class="whitespace-nowrap">by Google.</span>
                <span class="block">Cited by ChatGPT.</span>
              </h1>
              <p class="text-toned max-w-2xl text-center text-lg sm:text-xl lg:text-left mb-6 leading-relaxed">
                Submit every new URL straight to Google's <NuxtLink to="https://developers.google.com/search/apis/indexing-api/v3/quickstart" target="_blank" class="font-semibold text-primary underline decoration-primary/30 underline-offset-4 hover:decoration-primary/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-default rounded">
                  Indexing API
                </NuxtLink> and Bing IndexNow. Track citations across ChatGPT, Claude, Perplexity, Gemini, and Copilot. Keep all of it past Google's 16-month wipe.
              </p>
              <p class="text-muted text-center lg:text-left text-base mb-10 max-w-2xl">
                First indexed page in 48 hours. Daily citation tracking from day one.
              </p>

              <div class="flex items-center justify-center gap-3 flex-row sm:gap-4 lg:justify-start">
                <template v-if="!loggedIn">
                  <UButton to="/get-started" external size="xl" color="primary" trailing-icon="i-heroicons-arrow-right">
                    <span>Get started<span class="hidden sm:inline"> free</span></span>
                  </UButton>
                </template>
                <template v-else>
                  <UButton to="/dashboard" size="xl" color="primary">
                    <UAvatar :src="user.picture" size="xs" />
                    Dashboard
                  </UButton>
                </template>
                <UButton size="xl" variant="ghost" color="neutral" icon="i-simple-icons-github" target="_blank" to="https://github.com/harlan-zw/request-indexing">
                  View source
                </UButton>
              </div>

              <div class="flex items-center gap-x-5 gap-y-2 mt-8 text-sm text-muted flex-wrap justify-center lg:justify-start">
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-check-circle" class="size-4 text-primary" />
                  Connect with Google
                </span>
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-check-circle" class="size-4 text-primary" />
                  GPL-3.0
                </span>
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-check-circle" class="size-4 text-primary" />
                  Self-host or hosted
                </span>
              </div>
            </div>

            <div class="hidden xl:flex xl:col-span-5 max-w-full sticky top-10 items-center justify-center">
              <div class="w-full max-w-lg">
                <div class="rounded-xl border border-default bg-elevated shadow-2xl shadow-primary-500/10 overflow-hidden relative z-10">
                  <!-- Card header -->
                  <div class="px-5 py-4 border-b border-default flex items-center justify-between bg-elevated">
                    <div class="flex items-center gap-2.5">
                      <img src="https://www.google.com/s2/favicons?domain=https://nuxtseo.com" alt="" class="size-4 rounded-sm">
                      <span class="font-semibold text-default">nuxtseo.com</span>
                      <UBadge color="primary" variant="subtle" size="xs">
                        edge · live
                      </UBadge>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="size-2 rounded-full bg-primary-400 animate-pulse" />
                      <span class="text-xs text-muted">Live</span>
                    </div>
                  </div>
                  <!-- Mock event rows: indexing + crawler + citation -->
                  <div class="divide-y divide-default bg-elevated">
                    <div
                      v-for="(item, i) in mockEvents"
                      :key="i"
                      class="px-5 py-3 flex items-center justify-between gap-4 text-sm group hover:bg-muted transition-colors animate-fade-in"
                      :style="{ '--stagger-index': i }"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <UIcon
                          :name="item.icon"
                          class="size-4 shrink-0"
                          :class="{
                            'text-primary': item.tone === 'pass',
                            'text-amber-400': item.tone === 'crawler',
                            'text-fuchsia-400': item.tone === 'cite',
                          }"
                        />
                        <div class="min-w-0">
                          <div class="truncate text-toned font-mono text-xs">
                            {{ item.label }}
                          </div>
                          <div class="truncate text-muted text-[0.65rem] mt-0.5">
                            {{ item.meta }}
                          </div>
                        </div>
                      </div>
                      <span class="text-muted text-xs whitespace-nowrap hidden sm:block">{{ item.ago }}</span>
                    </div>
                  </div>
                  <!-- Card footer -->
                  <div class="px-5 py-3 bg-muted border-t border-default flex items-center justify-between">
                    <span class="text-xs text-muted">3 indexed · 2 AI hits · 1 citation today</span>
                    <span class="text-xs text-primary font-medium">retained →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </UContainer>
    </div>

    <div class="bg-default pt-20">
      <!-- Features — editorial bento -->
      <section class="max-w-7xl mx-auto px-6 lg:px-8 py-16 sm:py-24">
        <div class="max-w-3xl mb-12 lg:mb-16">
          <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-5 block">
            Why it works
          </span>
          <h2 class="font-title text-4xl sm:text-5xl lg:text-6xl font-semibold text-default tracking-[-0.035em] leading-[1.02]">
            Visibility shouldn't be <span class="italic text-primary">luck</span>.
          </h2>
          <p class="text-toned text-lg sm:text-xl mt-6 max-w-2xl leading-relaxed">
            Direct API submission, daily LLM citation tracking, retention that outlasts Google's 16-month wipe, and an open engine you can self-host. Ahrefs sits outside the request path — we don't have to.
          </p>
        </div>

        <div class="grid lg:grid-cols-6 gap-4 lg:gap-5">
          <!-- Dominant feature: Submission -->
          <div class="lg:col-span-4 rounded-2xl border border-default bg-elevated p-8 sm:p-10 relative overflow-hidden group">
            <div class="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            <div class="relative">
              <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] mb-6">
                <UIcon name="i-heroicons-bolt-solid" class="size-3.5" />
                Indexing API + IndexNow
              </div>
              <h3 class="font-title text-2xl sm:text-3xl font-semibold text-default tracking-[-0.02em] mb-3 leading-[1.1]">
                Submit directly. Skip the queue.
              </h3>
              <p class="text-toned leading-relaxed max-w-xl mb-8">
                Google Indexing API notifies the crawler immediately; Bing IndexNow covers the rest. New pages get picked up in hours, not weeks of hoping Discover stumbles on your sitemap.
              </p>
              <div class="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                <span class="inline-flex items-center gap-2 text-default">
                  <UIcon name="i-heroicons-check-circle" class="size-4 text-primary" />
                  <span class="font-medium">200 requests/day</span>
                </span>
                <span class="inline-flex items-center gap-2 text-default">
                  <UIcon name="i-heroicons-check-circle" class="size-4 text-primary" />
                  <span class="font-medium">Bulk + scheduled</span>
                </span>
                <span class="inline-flex items-center gap-2 text-default">
                  <UIcon name="i-heroicons-check-circle" class="size-4 text-primary" />
                  <span class="font-medium">CI/CD friendly</span>
                </span>
              </div>
            </div>
          </div>

          <!-- AI crawler observability -->
          <div class="lg:col-span-2 rounded-2xl border border-default bg-elevated p-8 relative overflow-hidden">
            <UIcon name="i-heroicons-eye" class="size-7 text-primary mb-5" />
            <h3 class="font-title text-xl font-semibold text-default tracking-[-0.015em] mb-2">
              AI crawlers, caught at the edge
            </h3>
            <p class="text-toned text-sm leading-relaxed">
              GPTBot, ClaudeBot, PerplexityBot, Google-Extended — six new crawlers since 2023 your analytics never sees. We log every hit before it reaches your origin.
            </p>
          </div>

          <!-- Citation tracking -->
          <div class="lg:col-span-2 rounded-2xl border border-default bg-elevated p-8">
            <UIcon name="i-heroicons-sparkles" class="size-7 text-primary mb-5" />
            <h3 class="font-title text-xl font-semibold text-default tracking-[-0.015em] mb-2">
              Who cited you. Who dropped you.
            </h3>
            <p class="text-toned text-sm leading-relaxed">
              Daily runs across ChatGPT, Claude, Perplexity, Gemini, and Copilot. ChatGPT forgets your page tomorrow; the timeline doesn't.
            </p>
          </div>

          <!-- Retention -->
          <div class="lg:col-span-2 rounded-2xl border border-default bg-elevated p-8">
            <UIcon name="i-heroicons-archive-box" class="size-7 text-primary mb-5" />
            <h3 class="font-title text-xl font-semibold text-default tracking-[-0.015em] mb-2">
              History beyond 16 months
            </h3>
            <p class="text-toned text-sm leading-relaxed">
              Google wipes your Search Console data at 16 months. We retain it as append-only Parquet on R2 — queryable, exportable, yours.
            </p>
          </div>

          <!-- MCP / agent native -->
          <div class="lg:col-span-2 rounded-2xl border border-default bg-elevated p-8">
            <UIcon name="i-heroicons-command-line" class="size-7 text-primary mb-5" />
            <h3 class="font-title text-xl font-semibold text-default tracking-[-0.015em] mb-2">
              MCP-first, agent-native
            </h3>
            <p class="text-toned text-sm leading-relaxed">
              Every capability is a typed MCP tool. Drive the same engine from Claude Code, Cursor, or your CI script. What the dashboard does, your agent does.
            </p>
          </div>

          <!-- Open source -->
          <div class="lg:col-span-2 rounded-2xl border border-default bg-elevated p-8">
            <UIcon name="i-simple-icons-github" class="size-7 text-primary mb-5" />
            <h3 class="font-title text-xl font-semibold text-default tracking-[-0.015em] mb-2">
              Open, portable, yours
            </h3>
            <p class="text-toned text-sm leading-relaxed">
              GPL-3.0 on GitHub. Hosted product is one deployment of the open engine — self-host on your own Cloudflare with your own keys whenever you like.
            </p>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <UPageSection
        headline="How it works"
        title="Sign in, submit, retain — in four steps"
        description="Connect Google to start, add the edge Worker if you want AI crawler observability, push URLs to Google and Bing, and retain every indexing event and citation past the 16-month wipe."
        :ui="{ container: 'max-w-7xl', title: 'font-title' }"
      >
        <div class="mt-12 lg:mt-16 grid gap-14 lg:gap-24">
          <template v-for="(step, i) in walkthroughSteps" :key="step.num">
            <div class="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center">
              <div class="lg:col-span-5" :class="[i % 2 === 1 ? 'lg:order-2' : '']">
                <div class="flex items-center gap-3 mb-5">
                  <span class="inline-flex size-10 rounded-full bg-primary/10 text-primary font-mono text-sm font-semibold items-center justify-center">
                    {{ step.num }}
                  </span>
                  <span class="text-xs text-muted font-semibold uppercase tracking-[0.2em]">{{ step.eyebrow }}</span>
                </div>
                <h3 class="font-title text-2xl sm:text-3xl font-semibold text-default mb-3 tracking-[-0.02em] leading-[1.15]">
                  {{ step.title }}
                </h3>
                <p class="text-toned leading-relaxed mb-6">
                  {{ step.description }}
                </p>
                <ul class="space-y-2.5 text-sm text-muted">
                  <li v-for="bullet in step.bullets" :key="bullet" class="flex items-start gap-2.5">
                    <UIcon name="i-heroicons-check" class="size-4 text-primary mt-0.5 shrink-0" />
                    <span>{{ bullet }}</span>
                  </li>
                </ul>
              </div>
              <div class="lg:col-span-7" :class="[i % 2 === 1 ? 'lg:order-1' : '']">
                <!-- Step 1: Google sign-in -->
                <div v-if="i === 0" class="rounded-xl border border-default bg-elevated shadow-lg overflow-hidden">
                  <div class="flex items-center gap-2 px-5 py-3 border-b border-default bg-muted/60">
                    <div class="flex gap-1.5">
                      <span class="size-2.5 rounded-full bg-red-400" />
                      <span class="size-2.5 rounded-full bg-amber-400" />
                      <span class="size-2.5 rounded-full bg-primary/70" />
                    </div>
                    <span class="text-xs text-muted font-mono ml-2 truncate">accounts.google.com</span>
                  </div>
                  <div class="p-7 sm:p-10 text-center">
                    <UIcon name="i-simple-icons-google" class="size-8 mx-auto mb-4 text-blue-500" />
                    <p class="text-default font-semibold mb-1">
                      Choose an account
                    </p>
                    <p class="text-muted text-sm mb-6">
                      to continue to Request Indexing
                    </p>
                    <div class="space-y-2 mb-6 max-w-xs mx-auto">
                      <button type="button" class="w-full inline-flex items-center gap-3 rounded-md border border-default px-4 py-3 bg-default hover:bg-muted transition-colors text-left cursor-default">
                        <GoogleSvg class="size-5 shrink-0" />
                        <div class="flex-1 min-w-0">
                          <div class="text-sm font-medium text-default truncate">
                            harlan@example.com
                          </div>
                          <div class="text-xs text-muted truncate">
                            Harlan Wilton
                          </div>
                        </div>
                        <UIcon name="i-heroicons-check" class="size-4 text-primary" />
                      </button>
                    </div>
                    <p class="text-xs text-muted">
                      Read-only access to Search Console
                    </p>
                  </div>
                </div>
                <!-- Step 2: CNAME / DNS record (optional edge mode) -->
                <div v-else-if="i === 1" class="rounded-xl border border-default bg-elevated shadow-lg overflow-hidden">
                  <div class="flex items-center gap-2 px-5 py-3 border-b border-default bg-muted/60">
                    <UIcon name="i-simple-icons-cloudflare" class="size-4 text-amber-500" />
                    <span class="text-xs font-mono text-muted">dash.cloudflare.com / DNS</span>
                    <UBadge color="neutral" variant="subtle" size="xs" class="ml-auto">
                      Optional
                    </UBadge>
                  </div>
                  <div class="px-5 py-5 font-mono text-xs sm:text-sm overflow-x-auto">
                    <div class="grid grid-cols-[auto_1fr_2fr] gap-x-6 gap-y-2 items-center">
                      <span class="text-muted">Type</span>
                      <span class="text-default">CNAME</span>
                      <span class="text-muted text-[0.65rem] uppercase tracking-wider">proxied</span>
                      <span class="text-muted">Name</span>
                      <span class="text-default">@</span>
                      <span class="text-muted text-[0.65rem]">your domain</span>
                      <span class="text-muted">Target</span>
                      <span class="text-primary">edge.requestindexing.com</span>
                      <span class="text-muted text-[0.65rem]">our Worker</span>
                    </div>
                    <div class="mt-5 pt-4 border-t border-default flex items-center gap-2 text-toned">
                      <span class="size-1.5 rounded-full bg-primary animate-pulse" />
                      <span class="text-xs">First GPTBot hit logged 47s after propagation</span>
                    </div>
                  </div>
                </div>
                <!-- Step 3: Code block -->
                <div v-else-if="i === 2" class="rounded-xl border border-default bg-elevated shadow-lg overflow-hidden">
                  <div class="flex items-center gap-2 px-5 py-3 border-b border-default bg-muted/60">
                    <UIcon name="i-heroicons-command-line" class="size-4 text-muted" />
                    <span class="text-xs font-mono text-muted">POST /v3/urlNotifications:publish</span>
                    <UBadge color="primary" variant="subtle" size="xs" class="ml-auto">
                      200 OK
                    </UBadge>
                  </div>
                  <pre class="px-5 py-5 text-xs sm:text-sm font-mono text-toned overflow-x-auto leading-relaxed"><code><span class="text-muted"># Fires on every deploy. Indexing API + IndexNow in one call.</span>
<span class="text-primary">curl</span> <span class="text-default">-X POST</span> \
  <span class="text-default">-H</span> <span class="text-toned">"Authorization: Bearer $TOKEN"</span> \
  <span class="text-default">--data</span> <span class="text-toned">'{
    "url": "https://example.com/new-page",
    "type": "URL_UPDATED"
  }'</span> \
  <span class="text-primary">api.requestindexing.com/v1/submit</span></code></pre>
                </div>
                <!-- Step 4: Citation timeline -->
                <div v-else class="rounded-xl border border-default bg-elevated shadow-lg overflow-hidden">
                  <div class="px-5 py-3.5 border-b border-default flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <UIcon name="i-heroicons-sparkles" class="size-4 text-muted" />
                      <span class="text-sm font-semibold text-default">Citation timeline</span>
                    </div>
                    <span class="text-xs text-muted font-mono">past 7 days</span>
                  </div>
                  <div class="divide-y divide-default">
                    <div class="px-5 py-3.5 flex items-center gap-3 text-sm">
                      <UIcon name="i-simple-icons-openai" class="size-4 text-default shrink-0" />
                      <span class="flex-1 text-toned text-xs truncate">"best indexing tool for nuxt"</span>
                      <UBadge color="primary" variant="subtle" size="xs">
                        Cited
                      </UBadge>
                      <span class="text-xs text-muted font-mono hidden sm:inline">Mon</span>
                    </div>
                    <div class="px-5 py-3.5 flex items-center gap-3 text-sm">
                      <UIcon name="i-simple-icons-perplexity" class="size-4 text-default shrink-0" />
                      <span class="flex-1 text-toned text-xs truncate">"google indexing api alternatives"</span>
                      <UBadge color="primary" variant="subtle" size="xs">
                        Cited
                      </UBadge>
                      <span class="text-xs text-muted font-mono hidden sm:inline">Wed</span>
                    </div>
                    <div class="px-5 py-3.5 flex items-center gap-3 text-sm bg-primary/5">
                      <UIcon name="i-simple-icons-anthropic" class="size-4 text-default shrink-0" />
                      <span class="flex-1 text-default text-xs truncate font-medium">"how to retain gsc data past 16 months"</span>
                      <UBadge color="primary" variant="subtle" size="xs">
                        Cited
                      </UBadge>
                      <span class="text-xs text-muted font-mono hidden sm:inline">Fri</span>
                    </div>
                  </div>
                  <div class="px-5 py-3 bg-muted/60 border-t border-default flex items-center justify-between">
                    <span class="text-xs text-muted">Retained in your R2 — exportable any time</span>
                    <UIcon name="i-heroicons-archive-box" class="size-3.5 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </UPageSection>

      <!-- MCP one-liner -->
      <section class="max-w-7xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
        <div class="grid lg:grid-cols-12 gap-10 items-center">
          <div class="lg:col-span-5">
            <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-5 block">
              Agent-native
            </span>
            <h2 class="font-title text-3xl sm:text-4xl font-semibold text-default tracking-[-0.03em] leading-[1.1] mb-5">
              What the dashboard does,<br>your agent does.
            </h2>
            <p class="text-toned leading-relaxed">
              Every capability is a typed MCP tool. One call, typed result, same engine the dashboard uses.
            </p>
          </div>
          <div class="lg:col-span-7">
            <div class="rounded-xl border border-default bg-elevated shadow-lg overflow-hidden">
              <div class="flex items-center gap-2 px-5 py-3 border-b border-default bg-muted/60">
                <div class="flex gap-1.5">
                  <span class="size-2.5 rounded-full bg-red-400" />
                  <span class="size-2.5 rounded-full bg-amber-400" />
                  <span class="size-2.5 rounded-full bg-primary/70" />
                </div>
                <span class="text-xs font-mono text-muted ml-2">claude code</span>
              </div>
              <div class="px-6 py-6 text-sm font-mono leading-relaxed">
                <p class="text-muted italic mb-4">
                  &gt; Which pages got cited by Perplexity this week, which dropped, and submit the ones we updated since the last deploy.
                </p>
                <div class="text-toned">
                  <div class="text-primary">
                    → requestindexing.citations(engine: "perplexity", since: "7d")
                  </div>
                  <div class="text-default mt-1 text-xs">
                    12 cited · 2 dropped · 1 new
                  </div>
                  <div class="text-primary mt-3">
                    → requestindexing.submit(urls: $changed)
                  </div>
                  <div class="text-default mt-1 text-xs">
                    6 queued · Google + IndexNow
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Free Tools -->
      <UPageSection
        headline="Free tools"
        title="Check indexing without signing up"
        description="Three single-purpose tools for when you just need an answer. No account, no email, no tracking."
        :ui="{ container: 'max-w-7xl', title: 'font-title' }"
      >
        <UPageGrid>
          <UPageCard
            v-for="tool in marketingTools"
            :key="tool.to"
            :title="tool.title"
            :description="tool.description"
            :icon="tool.icon"
            :to="tool.to"
            spotlight
            spotlight-color="primary"
            variant="outline"
          />
        </UPageGrid>
        <div class="flex justify-center mt-8">
          <UButton to="/tools" variant="ghost" color="neutral" trailing-icon="i-heroicons-arrow-right">
            View all tools
          </UButton>
        </div>
      </UPageSection>

      <!-- Data Retention — pull quote dominant -->
      <section class="relative py-16 sm:py-24">
        <div class="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div class="lg:col-span-5">
            <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-5 block">
              Data preservation
            </span>
            <h2 class="font-title text-4xl sm:text-5xl font-semibold text-default tracking-[-0.035em] leading-[1.05] mb-6">
              Google forgets.<br>The LLMs forget.<br>We don't.
            </h2>
            <p class="text-toned text-lg leading-relaxed mb-8 max-w-md">
              Search Console wipes at 16 months. ChatGPT cites you today and forgets tomorrow. We append both to Parquet on R2 — seasonal patterns, year-over-year, citation drift, all retained.
            </p>
            <div class="space-y-4">
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-archive-box" class="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div class="text-default font-semibold mb-0.5">
                    Retain forever
                  </div>
                  <div class="text-muted text-sm">
                    GSC, crawler logs, citation timelines &mdash; append-only, exportable any time.
                  </div>
                </div>
              </div>
              <div class="flex items-start gap-3">
                <UIcon name="i-heroicons-finger-print" class="size-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div class="text-default font-semibold mb-0.5">
                    Own your data
                  </div>
                  <div class="text-muted text-sm">
                    One-command export, day one. If we pivot, your CNAME flips back and your Parquet is yours.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <figure class="lg:col-span-7 relative">
            <div class="absolute -top-6 -left-2 text-primary/20 font-title text-[10rem] leading-none select-none pointer-events-none" aria-hidden="true">
              &ldquo;
            </div>
            <blockquote class="relative pl-12 lg:pl-16">
              <p class="font-title text-2xl sm:text-3xl lg:text-4xl text-default tracking-[-0.02em] leading-[1.2] font-medium">
                Search Console keeps data for the last 16 months. As a result, SEO reports in Analytics also include a maximum of 16 months of data.
              </p>
              <footer class="mt-6 flex items-center gap-3">
                <UIcon name="i-simple-icons-google" class="size-5 text-blue-500" />
                <NuxtLink
                  to="https://support.google.com/analytics/answer/1308621"
                  target="_blank"
                  class="text-sm text-muted hover:text-default transition-colors"
                >
                  Google Analytics Documentation &rarr;
                </NuxtLink>
              </footer>
            </blockquote>
          </figure>
        </div>
      </section>

      <!-- Trust Strip -->
      <section class="max-w-7xl mx-auto px-6 lg:px-8 py-16 sm:py-20 border-y border-default">
        <div class="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          <div class="lg:col-span-5">
            <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-5 block">
              Built in the open
            </span>
            <h2 class="font-title text-3xl sm:text-4xl font-semibold text-default tracking-[-0.03em] leading-[1.1]">
              No paywall, no surveillance, no lock-in.
            </h2>
          </div>
          <div class="lg:col-span-7 grid sm:grid-cols-3 gap-8 lg:gap-10">
            <div>
              <UIcon name="i-simple-icons-cloudflare" class="size-6 text-primary mb-3" />
              <div class="font-title text-base font-semibold text-default mb-1.5 tracking-[-0.01em]">
                Cloudflare-native
              </div>
              <p class="text-muted text-sm leading-relaxed">
                Workers, D1, R2, Queues. Self-host the same Worker on your own account with your own keys.
              </p>
            </div>
            <div>
              <UIcon name="i-simple-icons-github" class="size-6 text-primary mb-3" />
              <div class="font-title text-base font-semibold text-default mb-1.5 tracking-[-0.01em]">
                GPL-3.0
              </div>
              <p class="text-muted text-sm leading-relaxed">
                Released on GitHub. Built by the maintainer of Nuxt SEO (3.5M+ downloads/mo).
              </p>
            </div>
            <div>
              <UIcon name="i-heroicons-arrow-down-tray" class="size-6 text-primary mb-3" />
              <div class="font-title text-base font-semibold text-default mb-1.5 tracking-[-0.01em]">
                Exportable, day one
              </div>
              <p class="text-muted text-sm leading-relaxed">
                One-command export. If we get bored, your CNAME flips back and your Parquet is yours.
              </p>
            </div>
          </div>
        </div>
      </section>

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
          description="Free, open-source, and takes less than a minute to set up. Add the edge Worker later if you want AI crawler observability."
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

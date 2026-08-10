<script lang="ts" setup>
import CitationsPanel from './_alt/CitationsPanel.vue'
import DeployTimeline from './_alt/DeployTimeline.vue'
import EdgeDashboard from './_alt/EdgeDashboard.vue'
import HeroVisibilitySurface from './_alt/HeroVisibilitySurface.vue'
import IndexingQueue from './_alt/IndexingQueue.vue'
import McpTerminal from './_alt/McpTerminal.vue'
import RetentionChart from './_alt/RetentionChart.vue'

const { loggedIn, user } = useUserSession()

useSeoMeta({
  title: 'Request Indexing: every AI crawler, every engine, your data forever',
  description: 'Open-source edge layer for AI visibility. Observe GPTBot, ClaudeBot, PerplexityBot at the edge. Submit to Google and Bing. Track citations across five LLMs. Retain everything past Google\'s 16-month wipe.',
})

const moats = [
  {
    eyebrow: 'In your stack',
    title: 'Your data, your D1',
    body: 'Edge crawler logs and LLM citations land in your Cloudflare account. Self-host or use ours; export to Parquet any time.',
    icon: 'i-heroicons-cube',
  },
  {
    eyebrow: 'On Cloudflare',
    title: 'One Worker, six jobs',
    body: 'Observe, inject, prerender, submit, track, retain. Side effects of being in the request path on Workers + D1 + R2 + Queues.',
    icon: 'i-simple-icons-cloudflare',
  },
  {
    eyebrow: 'GPL-3.0',
    title: 'Open by default',
    body: 'The hosted product is one deployment of the open engine. Same code, same MCP, same CLI. No secret sauce in a closed dashboard.',
    icon: 'i-simple-icons-github',
  },
]
</script>

<template>
  <div class="bg-default">
    <!-- HERO -->
    <div class="bg-verdant divider-tilt">
      <UContainer class="z-1 relative max-w-8xl xl:max-w-[1400px]" :ui="{ container: 'max-w-8xl xl:max-w-[1335px]!' }">
        <section class="py-8 sm:py-12 xl:py-20">
          <div class="grid xl:grid-cols-12 gap-10 xl:gap-12 items-center">
            <div class="text-pretty xl:col-span-5 flex flex-col">
              <div class="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] mb-6 self-start">
                <span class="size-1.5 rounded-full bg-primary animate-pulse" />
                Open source · Cloudflare-native
              </div>
              <h1 class="font-title font-bold leading-[0.95] tracking-[-0.045em] text-default text-5xl sm:text-6xl xl:text-[5rem] mb-6">
                Get indexed by Google.<br>
                Cited by <span class="italic text-primary">ChatGPT</span>.
              </h1>
              <p class="text-toned text-lg sm:text-xl mb-3 leading-relaxed max-w-xl">
                One Cloudflare Worker submits every new URL to Google and Bing, tracks every LLM citation across ChatGPT, Claude, Perplexity, Gemini, and Copilot, and keeps all of it past Google's 16-month wipe.
              </p>
              <p class="text-muted text-base mb-8 leading-relaxed max-w-xl">
                Point a CNAME. First indexed page in 48 hours, first AI citation logged this week, no origin changes ever.
              </p>
              <div class="flex items-center gap-3 flex-wrap">
                <template v-if="!loggedIn">
                  <UButton to="/get-started" external size="xl" color="primary" trailing-icon="i-heroicons-arrow-right">
                    Start free
                  </UButton>
                </template>
                <template v-else>
                  <UButton to="/dashboard" size="xl" color="primary">
                    <UAvatar :src="user.picture" size="xs" />
                    Open dashboard
                  </UButton>
                </template>
                <UButton size="xl" variant="ghost" color="neutral" icon="i-simple-icons-github" target="_blank" to="https://github.com/harlan-zw/request-indexing">
                  GitHub
                </UButton>
              </div>
              <div class="flex items-center gap-5 mt-8 text-sm text-muted">
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-check-circle" class="size-4 text-primary" />
                  No origin changes
                </span>
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-heroicons-check-circle" class="size-4 text-primary" />
                  GPL-3.0
                </span>
              </div>
            </div>

            <div class="xl:col-span-7">
              <HeroVisibilitySurface />
              <p class="text-center text-xs text-muted mt-3 italic">
                The outcome above. The mechanism below. Both live on your dashboard from the moment your CNAME flips.
              </p>
            </div>
          </div>
        </section>
      </UContainer>
    </div>

    <!-- EDGE OBSERVABILITY -->
    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-28">
      <div class="max-w-3xl mb-12">
        <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-4 block">
          Edge observability
        </span>
        <h2 class="font-title text-4xl sm:text-5xl font-semibold text-default tracking-[-0.035em] leading-[1.02] mb-5">
          Which bots, which pages, when.
        </h2>
        <p class="text-toned text-lg leading-relaxed">
          Six new AI crawlers shipped since 2023 and your analytics don't see any of them. We catch every hit at the edge before it reaches your origin and put it in a dashboard you can read.
        </p>
      </div>
      <EdgeDashboard />
    </section>

    <!-- CITATIONS -->
    <section class="bg-muted py-20 sm:py-28">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="max-w-3xl mb-12">
          <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-4 block">
            Citation tracking
          </span>
          <h2 class="font-title text-4xl sm:text-5xl font-semibold text-default tracking-[-0.035em] leading-[1.02] mb-5">
            Who cited you. Who dropped you.
          </h2>
          <p class="text-toned text-lg leading-relaxed">
            We ask the five major LLMs about your topics every day and store the answers indefinitely. ChatGPT forgets your page tomorrow; the timeline doesn't.
          </p>
        </div>
        <CitationsPanel />
      </div>
    </section>

    <!-- SUBMIT + RETAIN -->
    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-28">
      <div class="grid lg:grid-cols-2 gap-6 lg:gap-8">
        <div>
          <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-4 block">
            Submission
          </span>
          <h3 class="font-title text-2xl sm:text-3xl font-semibold text-default tracking-[-0.025em] leading-[1.1] mb-3">
            Push URLs the moment they go live.
          </h3>
          <p class="text-toned leading-relaxed mb-6">
            Google Indexing API and Bing IndexNow on the same deploy hook. Quota-aware, retry-aware.
          </p>
          <IndexingQueue />
        </div>
        <div>
          <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-4 block">
            Retention
          </span>
          <h3 class="font-title text-2xl sm:text-3xl font-semibold text-default tracking-[-0.025em] leading-[1.1] mb-3">
            Google forgets at 16 months. We don't.
          </h3>
          <p class="text-toned leading-relaxed mb-6">
            Append-only Parquet on R2. Queryable forever, exportable in one command.
          </p>
          <RetentionChart />
        </div>
      </div>
    </section>

    <!-- DEPLOY -->
    <section class="bg-muted py-20 sm:py-28">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="max-w-3xl mb-12">
          <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-4 block">
            Setup
          </span>
          <h2 class="font-title text-4xl sm:text-5xl font-semibold text-default tracking-[-0.035em] leading-[1.02] mb-5">
            CNAME to first hit in under a minute.
          </h2>
          <p class="text-toned text-lg leading-relaxed">
            No origin changes. No build step. No plugin to install on your CMS. One DNS record and the Worker is in the request path.
          </p>
        </div>
        <DeployTimeline />
      </div>
    </section>

    <!-- MCP -->
    <section class="max-w-7xl mx-auto px-6 lg:px-8 py-20 sm:py-28">
      <div class="grid lg:grid-cols-12 gap-10 items-center">
        <div class="lg:col-span-5">
          <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-4 block">
            MCP-first
          </span>
          <h2 class="font-title text-4xl sm:text-5xl font-semibold text-default tracking-[-0.035em] leading-[1.05] mb-5">
            Drive it from your agent.
          </h2>
          <p class="text-toned text-lg leading-relaxed mb-4">
            Every capability is a typed MCP tool. Same engine the dashboard uses, exposed to Claude Code, Cursor, or any agent loop.
          </p>
          <p class="text-muted text-sm leading-relaxed italic">
            "Which pages got cited by Perplexity this week, which dropped, and submit the ones we updated since the last deploy."
          </p>
        </div>
        <div class="lg:col-span-7">
          <McpTerminal />
        </div>
      </div>
    </section>

    <!-- WHY THIS STACK -->
    <section class="bg-muted py-20 sm:py-28">
      <div class="max-w-7xl mx-auto px-6 lg:px-8">
        <div class="max-w-3xl mb-12">
          <span class="text-xs text-primary font-semibold uppercase tracking-[0.2em] mb-4 block">
            Why this stack
          </span>
          <h2 class="font-title text-4xl sm:text-5xl font-semibold text-default tracking-[-0.035em] leading-[1.02]">
            Hard to copy. Easy to leave.
          </h2>
        </div>
        <div class="grid lg:grid-cols-3 gap-5">
          <div
            v-for="moat in moats"
            :key="moat.title"
            class="rounded-2xl border border-default bg-elevated p-7"
          >
            <UIcon :name="moat.icon" class="size-7 text-primary mb-5" />
            <div class="text-xs text-muted font-semibold uppercase tracking-[0.18em] mb-2">
              {{ moat.eyebrow }}
            </div>
            <h3 class="font-title text-xl font-semibold text-default tracking-[-0.015em] mb-3 leading-[1.15]">
              {{ moat.title }}
            </h3>
            <p class="text-toned text-sm leading-relaxed">
              {{ moat.body }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <UPageSection :ui="{ container: 'max-w-4xl' }">
      <UPageCTA
        title="Point a CNAME. First hit in 60 seconds."
        description="Free to start. Open source forever. Self-host on your own Cloudflare account when you outgrow ours."
        variant="subtle"
        :links="[
          { label: 'Start free', to: '/get-started', color: 'primary', size: 'xl', trailingIcon: 'i-heroicons-arrow-right' },
          { label: 'GitHub', to: 'https://github.com/harlan-zw/request-indexing', target: '_blank', variant: 'ghost', color: 'neutral', size: 'xl', icon: 'i-simple-icons-github' },
        ]"
      />
    </UPageSection>
  </div>
</template>

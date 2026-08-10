<script lang="ts" setup>
interface EnginePage {
  url: string
  cites: number
}

interface Engine {
  name: string
  icon: string
  accent: string
  bar: string
  citations: number
  share: number
  trend: number
  topPages: EnginePage[]
}

const engines: Engine[] = [
  {
    name: 'ChatGPT',
    icon: 'i-simple-icons-openai',
    accent: 'text-emerald-500',
    bar: 'bg-emerald-500',
    citations: 47,
    share: 31,
    trend: 4,
    topPages: [
      { url: '/learn/mastering-meta/title', cites: 14 },
      { url: '/tools/google-indexing-checker', cites: 11 },
      { url: '/docs/llms-txt', cites: 9 },
    ],
  },
  {
    name: 'Claude',
    icon: 'i-simple-icons-anthropic',
    accent: 'text-orange-500',
    bar: 'bg-orange-500',
    citations: 38,
    share: 25,
    trend: 2,
    topPages: [
      { url: '/sitemap/best-practices', cites: 13 },
      { url: '/guides/edge-rendering', cites: 9 },
      { url: '/blog/edge-rendering-spas', cites: 7 },
    ],
  },
  {
    name: 'Perplexity',
    icon: 'i-simple-icons-perplexity',
    accent: 'text-sky-500',
    bar: 'bg-sky-500',
    citations: 31,
    share: 20,
    trend: 7,
    topPages: [
      { url: '/learn/mastering-meta/title', cites: 11 },
      { url: '/docs/llms-txt', cites: 8 },
      { url: '/guides/indexing-api', cites: 6 },
    ],
  },
  {
    name: 'Gemini',
    icon: 'i-simple-icons-google',
    accent: 'text-blue-500',
    bar: 'bg-blue-500',
    citations: 22,
    share: 14,
    trend: -1,
    topPages: [
      { url: '/docs/llms-txt', cites: 7 },
      { url: '/pricing', cites: 5 },
      { url: '/guides/indexing-api', cites: 4 },
    ],
  },
  {
    name: 'Copilot',
    icon: 'i-simple-icons-microsoft',
    accent: 'text-cyan-500',
    bar: 'bg-cyan-500',
    citations: 15,
    share: 10,
    trend: 1,
    topPages: [
      { url: '/guides/indexing-api', cites: 6 },
      { url: '/changelog/v1', cites: 4 },
      { url: '/blog/edge-rendering-spas', cites: 3 },
    ],
  },
]

const topics = ['nuxt seo', 'indexing api', 'core web vitals', 'llms.txt', 'edge rendering']

interface DiffRow {
  kind: 'added' | 'dropped'
  engine: string
  page: string
  when: string
}

const citationDiff: DiffRow[] = [
  { kind: 'added', engine: 'perplexity', page: '/learn/mastering-meta/title', when: 'today' },
  { kind: 'added', engine: 'claude', page: '/sitemap/best-practices', when: 'today' },
  { kind: 'added', engine: 'chatgpt', page: '/tools/google-indexing-checker', when: 'yesterday' },
  { kind: 'dropped', engine: 'chatgpt', page: '/blog/v3-launch', when: 'yesterday' },
  { kind: 'added', engine: 'gemini', page: '/docs/llms-txt', when: '2 days ago' },
  { kind: 'added', engine: 'copilot', page: '/changelog/v1', when: '2 days ago' },
  { kind: 'dropped', engine: 'perplexity', page: '/changelog/v0', when: '3 days ago' },
  { kind: 'added', engine: 'claude', page: '/guides/edge-rendering', when: '4 days ago' },
]

// 30-day aggregate citation count sparkline
const sparkline = [
  9,
  11,
  8,
  13,
  14,
  12,
  17,
  15,
  19,
  16,
  21,
  18,
  23,
  20,
  26,
  24,
  22,
  28,
  25,
  31,
  29,
  27,
  33,
  30,
  36,
  34,
  38,
  41,
  39,
  47,
]

const sparkMax = Math.max(...sparkline)
const sparkMin = Math.min(...sparkline)
const sparkPoints = sparkline.map((v, i) => {
  const x = (i / (sparkline.length - 1)) * 100
  const y = 100 - ((v - sparkMin) / (sparkMax - sparkMin || 1)) * 100
  return `${x.toFixed(2)},${y.toFixed(2)}`
}).join(' ')

const totalCitations = engines.reduce((s, e) => s + e.citations, 0)
</script>

<template>
  <div class="grid lg:grid-cols-12 gap-5">
    <!-- ━━━ LEFT: Citations by engine ━━━ -->
    <div class="lg:col-span-5 rounded-2xl border border-default bg-elevated overflow-hidden shadow-2xl shadow-primary-500/10 flex flex-col">
      <div class="px-6 py-4 border-b border-default flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-chart-pie" class="size-4 text-primary" />
          <span class="text-default font-semibold text-sm">Citations by engine</span>
        </div>
        <span class="text-xs text-muted font-mono">last 7 days</span>
      </div>

      <div class="divide-y divide-default flex-1">
        <details
          v-for="(e, i) in engines"
          :key="e.name"
          class="group px-6 py-4 hover:bg-muted/30 transition-colors animate-fade-in"
          :style="{ '--stagger-index': i }"
        >
          <summary class="list-none cursor-pointer flex flex-col gap-2">
            <div class="flex items-center gap-3">
              <UIcon :name="e.icon" class="size-4 shrink-0" :class="e.accent" />
              <span class="text-sm text-default font-medium flex-1">{{ e.name }}</span>
              <span class="text-sm font-mono text-toned tabular-nums">{{ e.citations }}</span>
              <span
                class="text-xs font-mono tabular-nums w-8 text-right"
                :class="e.trend >= 0 ? 'text-primary' : 'text-red-500'"
              >
                {{ e.trend >= 0 ? '+' : '' }}{{ e.trend }}
              </span>
              <UIcon
                name="i-heroicons-chevron-down"
                class="size-3 text-muted transition-transform group-open:rotate-180"
              />
            </div>
            <div class="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-500 ease-out"
                :class="e.bar"
                :style="{ width: `${e.share * 2.4}%` }"
              />
            </div>
          </summary>
          <div class="mt-3 ml-7 space-y-1.5">
            <div
              v-for="p in e.topPages"
              :key="p.url"
              class="flex items-center gap-3 text-xs"
            >
              <UIcon name="i-heroicons-document-text" class="size-3 text-muted shrink-0" />
              <code class="font-mono text-toned flex-1 truncate">{{ p.url }}</code>
              <span class="font-mono text-muted tabular-nums shrink-0">{{ p.cites }}</span>
            </div>
          </div>
        </details>
      </div>

      <div class="px-6 py-4 bg-muted/40 border-t border-default">
        <div class="text-[10px] text-muted font-semibold uppercase tracking-[0.18em] mb-2">
          Tracked topics
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="t in topics"
            :key="t"
            class="inline-flex items-center gap-1 rounded-md bg-elevated border border-default px-2 py-0.5 text-[11px] font-mono text-toned"
          >
            <span class="size-1 rounded-full bg-primary" />
            {{ t }}
          </span>
        </div>
      </div>
    </div>

    <!-- ━━━ RIGHT: What changed ━━━ -->
    <div class="lg:col-span-7 rounded-2xl border border-default bg-elevated overflow-hidden shadow-2xl shadow-primary-500/10 flex flex-col">
      <div class="px-6 py-4 border-b border-default flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-arrows-right-left" class="size-4 text-primary" />
          <span class="text-default font-semibold text-sm">What changed</span>
        </div>
        <UBadge color="primary" variant="subtle" size="xs">
          stored forever
        </UBadge>
      </div>

      <!-- 30-day sparkline -->
      <div class="px-6 pt-4 pb-3 border-b border-default">
        <div class="flex items-baseline justify-between mb-2">
          <span class="text-[10px] text-muted font-semibold uppercase tracking-[0.18em]">
            Aggregate citations · 30d
          </span>
          <span class="text-xs font-mono text-toned tabular-nums">{{ totalCitations }} today</span>
        </div>
        <div class="relative h-12">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            class="absolute inset-0 w-full h-full overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="rgb(16 185 129)" stop-opacity="0.25" />
                <stop offset="100%" stop-color="rgb(16 185 129)" stop-opacity="0" />
              </linearGradient>
            </defs>
            <polygon
              :points="`0,100 ${sparkPoints} 100,100`"
              fill="url(#sparkfill)"
            />
            <polyline
              :points="sparkPoints"
              fill="none"
              stroke="rgb(16 185 129)"
              stroke-width="1.4"
              stroke-linejoin="round"
              stroke-linecap="round"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>

      <div class="divide-y divide-default font-mono text-sm flex-1">
        <div
          v-for="(d, i) in citationDiff"
          :key="d.page + d.kind + i"
          class="px-6 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors animate-fade-in"
          :style="{ '--stagger-index': i }"
        >
          <span
            class="size-6 rounded-md inline-flex items-center justify-center font-semibold text-xs shrink-0"
            :class="d.kind === 'added' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'"
          >
            {{ d.kind === 'added' ? '+' : '−' }}
          </span>
          <span class="text-muted text-xs w-20 shrink-0 lowercase">{{ d.engine }}</span>
          <span class="text-toned text-xs flex-1 truncate">{{ d.page }}</span>
          <span class="text-muted text-xs shrink-0 tabular-nums">{{ d.when }}</span>
        </div>
      </div>

      <div class="px-6 py-3 bg-muted/40 border-t border-default flex items-center justify-between text-xs">
        <span class="text-muted">Aggregated to Parquet on R2 nightly.</span>
        <span class="text-primary font-medium tabular-nums">+12 new this week</span>
      </div>
    </div>
  </div>
</template>

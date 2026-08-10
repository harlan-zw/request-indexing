<script lang="ts" setup>
interface Bot {
  name: string
  hits: number
  delta: number
  icon: string
  accent: string // bg-* color for swatch
  text: string // text-* for icon coloring
  trend: number[]
}

const botSummary: Bot[] = [
  { name: 'GPTBot', hits: 1284, delta: 18, icon: 'i-simple-icons-openai', accent: 'bg-emerald-500', text: 'text-emerald-500', trend: [42, 51, 48, 62, 70, 78, 84] },
  { name: 'PerplexityBot', hits: 892, delta: 47, icon: 'i-simple-icons-perplexity', accent: 'bg-sky-500', text: 'text-sky-500', trend: [22, 28, 35, 41, 38, 52, 64] },
  { name: 'ClaudeBot', hits: 614, delta: 22, icon: 'i-simple-icons-anthropic', accent: 'bg-orange-500', text: 'text-orange-500', trend: [30, 34, 32, 41, 38, 45, 51] },
  { name: 'Google-Extended', hits: 540, delta: -3, icon: 'i-simple-icons-google', accent: 'bg-blue-500', text: 'text-blue-500', trend: [44, 42, 46, 40, 38, 35, 37] },
  { name: 'OAI-SearchBot', hits: 318, delta: 9, icon: 'i-simple-icons-openai', accent: 'bg-emerald-400', text: 'text-emerald-400', trend: [18, 22, 20, 24, 26, 28, 31] },
  { name: 'Bingbot', hits: 196, delta: 12, icon: 'i-simple-icons-microsoftbing', accent: 'bg-cyan-500', text: 'text-cyan-500', trend: [12, 14, 16, 15, 18, 20, 22] },
  { name: 'Applebot-Extended', hits: 87, delta: 4, icon: 'i-simple-icons-apple', accent: 'bg-primary/60', text: 'text-toned', trend: [8, 9, 11, 10, 12, 13, 14] },
]

const totalHits = computed(() => botSummary.reduce((s, b) => s + b.hits, 0))
const lastWeekHits = 3247
const weekDelta = computed(() => Math.round(((totalHits.value - lastWeekHits) / lastWeekHits) * 100))

// Daily volume per bot (7 days, indexed: Mon..Sun). Weekends dip slightly.
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dailyByBot: Record<string, number[]> = {
  'GPTBot': [188, 172, 201, 184, 215, 152, 172],
  'PerplexityBot': [126, 118, 142, 138, 155, 98, 115],
  'ClaudeBot': [88, 81, 96, 91, 104, 71, 83],
  'Google-Extended': [82, 78, 84, 80, 86, 64, 66],
  'OAI-SearchBot': [44, 41, 48, 46, 52, 38, 49],
  'Bingbot': [28, 26, 31, 29, 33, 22, 27],
  'Applebot-Extended': [12, 11, 14, 13, 15, 9, 13],
}

const dailyTotals = computed(() => dayLabels.map((_, i) => botSummary.reduce((s, b) => s + (dailyByBot[b.name]?.[i] ?? 0), 0)))
const maxDaily = computed(() => Math.max(...dailyTotals.value))

const crawledPages = [
  { url: '/blog/edge-rendering-spas', hits: 412, bots: ['GPTBot', 'PerplexityBot', 'ClaudeBot'] },
  { url: '/docs/llms-txt', hits: 287, bots: ['PerplexityBot', 'GPTBot', 'Google-Extended'] },
  { url: '/guides/indexing-api', hits: 244, bots: ['OAI-SearchBot', 'GPTBot'] },
  { url: '/changelog/v1', hits: 198, bots: ['ClaudeBot', 'PerplexityBot'] },
  { url: '/pricing', hits: 172, bots: ['Google-Extended', 'GPTBot', 'Bingbot'] },
  { url: '/tools/google-indexing-checker', hits: 138, bots: ['GPTBot', 'PerplexityBot'] },
]

const hoveredBot = ref<string | null>(null)
const tooltipDay = ref<number | null>(null)

function dimBot(name: string): boolean {
  return hoveredBot.value !== null && hoveredBot.value !== name
}

// Sparkline points helper (0..100 viewBox)
function sparkPath(values: number[]): string {
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const stepX = 100 / (values.length - 1)
  return values
    .map((v, i) => {
      const x = i * stepX
      const y = 24 - ((v - min) / range) * 22 - 1
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}
</script>

<template>
  <div class="rounded-2xl border border-default bg-elevated overflow-hidden shadow-xl shadow-primary-500/5">
    <div class="px-6 py-4 border-b border-default flex items-center justify-between flex-wrap gap-4">
      <div class="flex items-center gap-2">
        <UIcon name="i-heroicons-chart-bar-square" class="size-4 text-primary" />
        <span class="text-default font-semibold text-sm">AI crawler activity &middot; last 7 days</span>
      </div>
      <div class="flex items-center gap-2 text-xs text-muted">
        <UBadge color="neutral" variant="subtle" size="xs">
          requestindexing.com
        </UBadge>
        <span>&middot;</span>
        <span class="font-mono tabular-nums">{{ totalHits.toLocaleString() }} hits</span>
        <span>&middot;</span>
        <span
          class="font-mono tabular-nums"
          :class="weekDelta >= 0 ? 'text-primary' : 'text-red-500'"
        >
          {{ weekDelta >= 0 ? '+' : '' }}{{ weekDelta }}% vs last week
        </span>
      </div>
    </div>

    <div class="grid lg:grid-cols-5 gap-0">
      <!-- LEFT: bot summary -->
      <div class="lg:col-span-2 lg:border-r border-default border-b lg:border-b-0">
        <div class="px-6 py-3 border-b border-default text-xs text-muted font-semibold uppercase tracking-wider">
          By bot
        </div>
        <div class="divide-y divide-default">
          <div
            v-for="bot in botSummary"
            :key="bot.name"
            class="px-6 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors cursor-default"
            :class="dimBot(bot.name) ? 'opacity-40' : ''"
            @mouseenter="hoveredBot = bot.name"
            @mouseleave="hoveredBot = null"
          >
            <span class="size-2.5 rounded-full shrink-0" :class="bot.accent" />
            <UIcon :name="bot.icon" class="size-4 shrink-0" :class="bot.text" />
            <span class="text-sm text-default font-medium flex-1 truncate">{{ bot.name }}</span>
            <svg
              class="shrink-0 hidden sm:block"
              :class="bot.text"
              viewBox="0 0 100 24"
              width="56"
              height="18"
              aria-hidden="true"
            >
              <path
                :d="sparkPath(bot.trend)"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                opacity="0.85"
              />
            </svg>
            <span class="font-mono text-sm text-toned tabular-nums w-14 text-right">{{ bot.hits.toLocaleString() }}</span>
            <span
              class="text-xs font-mono tabular-nums w-12 text-right"
              :class="bot.delta >= 0 ? 'text-primary' : 'text-red-500'"
            >
              {{ bot.delta >= 0 ? '+' : '' }}{{ bot.delta }}%
            </span>
          </div>
        </div>
      </div>

      <!-- RIGHT: chart + pages -->
      <div class="lg:col-span-3">
        <div class="px-6 py-3 border-b border-default text-xs text-muted font-semibold uppercase tracking-wider flex items-center justify-between">
          <span>Daily volume</span>
          <span v-if="hoveredBot" class="normal-case tracking-normal font-normal text-toned">
            highlighting <span class="font-mono text-default">{{ hoveredBot }}</span>
          </span>
        </div>
        <div class="px-6 py-6">
          <div
            class="flex items-end gap-2 h-36 relative"
            @mouseleave="tooltipDay = null"
          >
            <div
              v-for="(label, i) in dayLabels"
              :key="label"
              class="flex-1 h-full flex flex-col-reverse gap-px relative group"
              @mouseenter="tooltipDay = i"
            >
              <template v-for="bot in botSummary" :key="bot.name">
                <div
                  class="rounded-sm transition-all duration-200"
                  :class="[bot.accent, dimBot(bot.name) ? 'opacity-15' : '']"
                  :style="{ height: `${((dailyByBot[bot.name]?.[i] ?? 0) / maxDaily) * 100}%` }"
                  @mouseenter.stop="hoveredBot = bot.name; tooltipDay = i"
                  @mouseleave.stop="hoveredBot = null"
                />
              </template>
              <!-- tooltip -->
              <div
                v-if="tooltipDay === i"
                class="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-10 rounded-md border border-default bg-elevated shadow-lg shadow-primary-500/10 px-3 py-2 text-xs whitespace-nowrap pointer-events-none"
              >
                <div class="font-semibold text-default mb-1">
                  {{ label }} &middot; <span class="font-mono tabular-nums">{{ dailyTotals[i] }}</span>
                </div>
                <div
                  v-for="bot in botSummary.filter(b => (dailyByBot[b.name]?.[i] ?? 0) > 0)"
                  :key="bot.name"
                  class="flex items-center gap-1.5 text-toned"
                >
                  <span class="size-1.5 rounded-full" :class="bot.accent" />
                  <span class="flex-1">{{ bot.name }}</span>
                  <span class="font-mono tabular-nums ml-3">{{ dailyByBot[bot.name]?.[i] }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex justify-between mt-3 text-xs text-muted font-mono">
            <span v-for="d in dayLabels" :key="d">{{ d }}</span>
          </div>
        </div>

        <div class="px-6 py-3 border-y border-default text-xs text-muted font-semibold uppercase tracking-wider">
          Most-crawled pages
        </div>
        <div class="divide-y divide-default">
          <div
            v-for="page in crawledPages"
            :key="page.url"
            class="px-6 py-3 flex items-center gap-3"
          >
            <code class="text-toned font-mono text-xs flex-1 truncate">{{ page.url }}</code>
            <div class="flex -space-x-1.5 shrink-0">
              <span
                v-for="b in page.bots"
                :key="b"
                class="size-5 rounded-full ring-2 ring-elevated transition-opacity"
                :class="[botSummary.find(x => x.name === b)?.accent, dimBot(b) ? 'opacity-30' : '']"
                :title="b"
              />
            </div>
            <span class="font-mono text-sm text-default tabular-nums w-14 text-right">{{ page.hits }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

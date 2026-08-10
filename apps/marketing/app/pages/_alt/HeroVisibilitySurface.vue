<script lang="ts" setup>
import HeroFeed from './HeroFeed.vue'

interface Citation {
  engine: string
  engineSlug: string
  icon: string
  accent: string
  page: string
  ago: string
}

const baseCitations: Citation[] = [
  { engine: 'ChatGPT', engineSlug: 'chatgpt', icon: 'i-simple-icons-openai', accent: 'text-emerald-500', page: '/learn/mastering-meta/title', ago: '2h ago' },
  { engine: 'Perplexity', engineSlug: 'perplexity', icon: 'i-simple-icons-perplexity', accent: 'text-sky-500', page: '/docs/llms-txt', ago: '5h ago' },
  { engine: 'Claude', engineSlug: 'claude', icon: 'i-simple-icons-anthropic', accent: 'text-orange-500', page: '/sitemap/best-practices', ago: 'yesterday' },
]

const rotation: Citation[] = [
  { engine: 'Gemini', engineSlug: 'gemini', icon: 'i-simple-icons-google', accent: 'text-blue-500', page: '/guides/indexing-api', ago: 'just now' },
  { engine: 'ChatGPT', engineSlug: 'chatgpt', icon: 'i-simple-icons-openai', accent: 'text-emerald-500', page: '/tools/google-indexing-checker', ago: 'just now' },
  { engine: 'Copilot', engineSlug: 'copilot', icon: 'i-simple-icons-microsoft', accent: 'text-cyan-500', page: '/changelog/v1', ago: 'just now' },
]

const ageLadder = ['just now', '12m ago', '2h ago', '5h ago', 'yesterday']
const citations = ref<Citation[]>(baseCitations)
const newThisWeek = ref(12)
const rotationCursor = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

function pushCitation() {
  const next = { ...rotation[rotationCursor.value % rotation.length]! }
  rotationCursor.value++
  citations.value = [
    next,
    ...citations.value.slice(0, citations.value.length - 1).map((c, i) => ({
      ...c,
      ago: ageLadder[Math.min(i + 1, ageLadder.length - 1)]!,
    })),
  ]
  newThisWeek.value++
}

onMounted(() => {
  if (typeof window === 'undefined')
    return
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced)
    return
  // Slower cadence than the crawler feed; citations are an eventful arrival, not a constant stream.
  timer = setInterval(pushCitation, 9600)
})

onBeforeUnmount(() => {
  if (timer)
    clearInterval(timer)
})
</script>

<template>
  <div class="rounded-2xl border border-default bg-elevated shadow-2xl shadow-primary-500/20 overflow-hidden">
    <!-- TOP PANEL: outcomes (citations) -->
    <div class="bg-primary/5">
      <div class="px-5 py-3.5 border-b border-default flex items-center justify-between bg-primary/10">
        <div class="flex items-center gap-2.5 min-w-0">
          <UIcon name="i-heroicons-sparkles" class="size-4 text-primary shrink-0" />
          <span class="font-semibold text-default text-sm truncate">Cited this week</span>
          <UBadge color="primary" variant="subtle" size="xs">
            +{{ newThisWeek }} new
          </UBadge>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <UIcon name="i-heroicons-arrow-trending-up" class="size-3.5 text-primary" />
          <span class="text-muted hidden sm:inline">5 engines tracked</span>
        </div>
      </div>

      <ClientOnly>
        <TransitionGroup
          tag="div"
          name="citation"
          class="divide-y divide-default relative"
        >
          <div
            v-for="(c, i) in citations"
            :key="`${c.engineSlug}-${c.page}-${rotationCursor + i}`"
            class="px-5 py-3 flex items-center gap-4 text-sm group hover:bg-primary/5 transition-colors animate-fade-in"
            :style="{ '--stagger-index': i }"
          >
            <span class="size-6 rounded-md inline-flex items-center justify-center font-mono font-semibold text-xs bg-primary/10 text-primary shrink-0">
              +
            </span>
            <UIcon :name="c.icon" class="size-4 shrink-0" :class="c.accent" />
            <span class="text-toned shrink-0">
              <span class="font-semibold text-default">{{ c.engine }}</span>
              <span class="text-muted hidden sm:inline"> cited</span>
            </span>
            <code class="text-toned font-mono text-xs flex-1 truncate">{{ c.page }}</code>
            <span class="text-muted text-xs shrink-0 tabular-nums w-20 text-right">{{ c.ago }}</span>
          </div>
        </TransitionGroup>
        <template #fallback>
          <div class="divide-y divide-default">
            <div
              v-for="(c, i) in citations"
              :key="c.engineSlug + i"
              class="px-5 py-3 flex items-center gap-4 text-sm"
            >
              <span class="size-6 rounded-md inline-flex items-center justify-center font-mono font-semibold text-xs bg-primary/10 text-primary shrink-0">
                +
              </span>
              <UIcon :name="c.icon" class="size-4 shrink-0" :class="c.accent" />
              <span class="text-toned shrink-0">
                <span class="font-semibold text-default">{{ c.engine }}</span>
                <span class="text-muted hidden sm:inline"> cited</span>
              </span>
              <code class="text-toned font-mono text-xs flex-1 truncate">{{ c.page }}</code>
              <span class="text-muted text-xs shrink-0 tabular-nums w-20 text-right">{{ c.ago }}</span>
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- CAUSAL CONNECTOR -->
    <div class="bg-muted/40 border-y border-default px-5 py-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.25em] text-muted font-semibold">
      <UIcon name="i-heroicons-arrow-down" class="size-3 text-primary/70" />
      <span>Bots that fetched these pages first</span>
      <UIcon name="i-heroicons-arrow-down" class="size-3 text-primary/70" />
    </div>

    <!-- BOTTOM PANEL: upstream (crawlers) -->
    <HeroFeed naked />
  </div>
</template>

<style scoped>
.citation-enter-active,
.citation-leave-active {
  transition: opacity 400ms ease-out, transform 400ms ease-out;
}
.citation-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.citation-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
.citation-move {
  transition: transform 400ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .citation-enter-active,
  .citation-leave-active,
  .citation-move {
    transition: none;
  }
}
</style>

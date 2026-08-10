<script lang="ts" setup>
const { naked = false } = defineProps<{
  /** Skip the outer rounded card + caption when composed into a larger surface. */
  naked?: boolean
}>()

interface Hit {
  name: string
  icon: string
  accent: string
  dot: string
  path: string
  region: string
  ago: string
  ua: string
}

const baseHits: Hit[] = [
  { name: 'GPTBot', icon: 'i-simple-icons-openai', accent: 'text-emerald-500', dot: 'bg-emerald-500', path: '/blog/edge-rendering-spas', region: 'iad1', ago: 'just now', ua: 'Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)' },
  { name: 'PerplexityBot', icon: 'i-simple-icons-perplexity', accent: 'text-sky-500', dot: 'bg-sky-500', path: '/docs/llms-txt', region: 'ord1', ago: '3s ago', ua: 'Mozilla/5.0 AppleWebKit/537.36 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)' },
  { name: 'ClaudeBot', icon: 'i-simple-icons-anthropic', accent: 'text-orange-500', dot: 'bg-orange-500', path: '/changelog/v1', region: 'sfo1', ago: '11s ago', ua: 'Mozilla/5.0 AppleWebKit/537.36 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' },
  { name: 'Google-Extended', icon: 'i-simple-icons-google', accent: 'text-blue-500', dot: 'bg-blue-500', path: '/pricing', region: 'iad1', ago: '18s ago', ua: 'Mozilla/5.0 (compatible; Google-Extended; +https://google.com/bot.html)' },
  { name: 'OAI-SearchBot', icon: 'i-simple-icons-openai', accent: 'text-emerald-500', dot: 'bg-emerald-500', path: '/guides/indexing-api', region: 'lhr1', ago: '24s ago', ua: 'Mozilla/5.0 AppleWebKit/537.36 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)' },
  { name: 'Applebot-Extended', icon: 'i-simple-icons-apple', accent: 'text-default', dot: 'bg-primary/50', region: 'iad1', path: '/', ago: '38s ago', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605 Applebot-Extended/0.1' },
]

const rotation: Hit[] = [
  { name: 'PerplexityBot', icon: 'i-simple-icons-perplexity', accent: 'text-sky-500', dot: 'bg-sky-500', path: '/learn/mastering-meta/title', region: 'fra1', ago: 'just now', ua: 'Mozilla/5.0 AppleWebKit/537.36 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)' },
  { name: 'GPTBot', icon: 'i-simple-icons-openai', accent: 'text-emerald-500', dot: 'bg-emerald-500', path: '/sitemap/best-practices', region: 'iad1', ago: 'just now', ua: 'Mozilla/5.0 AppleWebKit/537.36 (compatible; GPTBot/1.2; +https://openai.com/gptbot)' },
  { name: 'ClaudeBot', icon: 'i-simple-icons-anthropic', accent: 'text-orange-500', dot: 'bg-orange-500', path: '/tools/google-indexing-checker', region: 'syd1', ago: 'just now', ua: 'Mozilla/5.0 AppleWebKit/537.36 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' },
  { name: 'Google-Extended', icon: 'i-simple-icons-google', accent: 'text-blue-500', dot: 'bg-blue-500', path: '/docs/llms-txt', region: 'iad1', ago: 'just now', ua: 'Mozilla/5.0 (compatible; Google-Extended; +https://google.com/bot.html)' },
]

const ageLadder = ['just now', '4s ago', '12s ago', '21s ago', '34s ago', '49s ago', '1m ago']
const hits = ref<Hit[]>(baseHits)
const hitsThisHour = ref(47)
const rotationCursor = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

function pushHit() {
  const next = { ...rotation[rotationCursor.value % rotation.length]! }
  rotationCursor.value++
  hits.value = [
    next,
    ...hits.value.slice(0, hits.value.length - 1).map((h, i) => ({
      ...h,
      ago: ageLadder[Math.min(i + 1, ageLadder.length - 1)]!,
    })),
  ]
  hitsThisHour.value++
}

onMounted(() => {
  if (typeof window === 'undefined')
    return
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced)
    return
  timer = setInterval(pushHit, 4800)
})

onBeforeUnmount(() => {
  if (timer)
    clearInterval(timer)
})
</script>

<template>
  <div>
    <div :class="naked ? '' : 'rounded-2xl border border-default bg-elevated shadow-2xl shadow-primary-500/20 overflow-hidden'">
      <div class="px-5 py-3.5 border-b border-default flex items-center justify-between bg-muted/40">
        <div class="flex items-center gap-2.5 min-w-0">
          <UIcon name="i-heroicons-signal" class="size-4 text-primary shrink-0" />
          <span class="font-semibold text-default text-sm truncate">edge.requestindexing.com</span>
          <UBadge color="primary" variant="subtle" size="xs">
            live
          </UBadge>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <span class="relative flex size-1.5">
            <span class="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
            <span class="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          <span class="text-muted hidden sm:inline">streaming &middot; last 60s</span>
        </div>
      </div>
      <ClientOnly>
        <TransitionGroup
          tag="div"
          name="feed"
          class="divide-y divide-default relative"
        >
          <details
            v-for="(hit, i) in hits"
            :key="`${hit.name}-${hit.path}-${rotationCursor + i}`"
            class="group block px-5 py-3 text-sm hover:bg-muted/40 transition-colors animate-fade-in [&_summary::-webkit-details-marker]:hidden"
            :style="{ '--stagger-index': i }"
          >
            <summary class="flex items-center gap-4 cursor-pointer list-none">
              <span class="size-2 rounded-full shrink-0" :class="hit.dot" />
              <UIcon :name="hit.icon" class="size-4 shrink-0" :class="hit.accent" />
              <span class="font-semibold text-default w-32 sm:w-40 shrink-0 truncate">{{ hit.name }}</span>
              <code class="text-toned font-mono text-xs flex-1 truncate hidden sm:block">{{ hit.path }}</code>
              <span class="text-muted text-xs font-mono hidden md:inline shrink-0 tabular-nums">{{ hit.region }}</span>
              <span class="text-muted text-xs shrink-0 tabular-nums w-20 text-right">{{ hit.ago }}</span>
              <UIcon
                name="i-heroicons-chevron-right"
                class="size-3 text-muted shrink-0 transition-transform duration-200 group-open:rotate-90 hidden sm:inline-block"
              />
            </summary>
            <div class="pl-6 pr-2 pt-2 pb-1 text-[11px] font-mono text-muted overflow-x-auto">
              <span class="text-toned">user-agent:</span> {{ hit.ua }}
            </div>
          </details>
        </TransitionGroup>
        <template #fallback>
          <div class="divide-y divide-default">
            <div
              v-for="(hit, i) in hits"
              :key="hit.name + i"
              class="px-5 py-3.5 flex items-center gap-4 text-sm"
            >
              <span class="size-2 rounded-full shrink-0" :class="hit.dot" />
              <UIcon :name="hit.icon" class="size-4 shrink-0" :class="hit.accent" />
              <span class="font-semibold text-default w-32 sm:w-40 shrink-0 truncate">{{ hit.name }}</span>
              <code class="text-toned font-mono text-xs flex-1 truncate hidden sm:block">{{ hit.path }}</code>
              <span class="text-muted text-xs font-mono hidden md:inline shrink-0 tabular-nums">{{ hit.region }}</span>
              <span class="text-muted text-xs shrink-0 tabular-nums w-20 text-right">{{ hit.ago }}</span>
            </div>
          </div>
        </template>
      </ClientOnly>
      <div class="px-5 py-3 bg-muted/40 border-t border-default flex items-center justify-between text-xs">
        <span class="text-muted font-mono">200 OK &middot; cf-worker &middot; drained to D1</span>
        <span class="text-primary font-medium tabular-nums">+{{ hitsThisHour }} this hour</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feed-enter-active,
.feed-leave-active {
  transition: opacity 350ms ease-out, transform 350ms ease-out;
}
.feed-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.feed-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
.feed-move {
  transition: transform 350ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .feed-enter-active,
  .feed-leave-active,
  .feed-move {
    transition: none;
  }
}
</style>

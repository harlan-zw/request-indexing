<script lang="ts" setup>
interface QueueRow {
  url: string
  status: 'queued' | 'submitted' | 'crawled' | 'indexed'
  icon: string
  stage: number
  took: string
  tone: 'primary' | 'sky' | 'neutral'
}

const rows = ref<QueueRow[]>([
  { url: '/blog/new-post', status: 'indexed', icon: 'i-heroicons-check-circle', stage: 100, took: '4h 12m', tone: 'primary' },
  { url: '/blog/changelog-march', status: 'crawled', icon: 'i-heroicons-magnifying-glass', stage: 62, took: '1h 04m', tone: 'sky' },
  { url: '/guides/edge-rendering', status: 'submitted', icon: 'i-heroicons-arrow-up-tray', stage: 28, took: '32s ago', tone: 'neutral' },
  { url: '/changelog/v1', status: 'queued', icon: 'i-heroicons-clock', stage: 6, took: 'in 2 min', tone: 'neutral' },
  { url: '/docs/llms-txt', status: 'indexed', icon: 'i-heroicons-check-circle', stage: 100, took: '6h 47m', tone: 'primary' },
  { url: '/tools/redirect-checker', status: 'submitted', icon: 'i-heroicons-arrow-up-tray', stage: 18, took: '1m ago', tone: 'neutral' },
])

// Animate row index 1 (the crawling row) live
const animatedIndex = 1
let interval: ReturnType<typeof setInterval> | null = null

function tick() {
  const row = rows.value[animatedIndex]
  if (!row)
    return
  const next = row.stage + (2 + Math.random() * 3)
  if (next >= 96) {
    row.stage = 60
    row.took = '1h 04m'
    row.status = 'crawled'
    row.tone = 'sky'
    row.icon = 'i-heroicons-magnifying-glass'
  }
  else {
    row.stage = next
  }
}

onMounted(() => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return
  interval = setInterval(tick, 1100)
})

onBeforeUnmount(() => {
  if (interval)
    clearInterval(interval)
})

const stats = {
  submitted: 89,
  indexed: 67,
  avg: '5h 12m',
}

const quotaUsed = 37
const quotaTotal = 200
const quotaPct = computed(() => (quotaUsed / quotaTotal) * 100)
</script>

<template>
  <div class="rounded-2xl border border-default bg-elevated overflow-hidden shadow-2xl shadow-primary-500/10">
    <!-- Header -->
    <div class="px-5 py-3.5 border-b border-default flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2 min-w-0">
        <UIcon name="i-heroicons-queue-list" class="size-4 text-primary shrink-0" />
        <span class="text-default font-semibold text-sm">Indexing queue</span>
      </div>
      <div class="flex items-center gap-2.5">
        <div class="h-1 w-16 rounded-full bg-muted overflow-hidden hidden sm:block">
          <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${quotaPct}%` }" />
        </div>
        <span class="text-xs text-muted font-mono tabular-nums">{{ quotaUsed }} / {{ quotaTotal }} today</span>
      </div>
    </div>

    <!-- Stats strip -->
    <div class="px-5 py-2.5 border-b border-default bg-muted/40 flex items-center gap-4 text-xs flex-wrap">
      <span class="text-muted uppercase tracking-wider text-[10px] font-semibold">Last 24h</span>
      <span class="flex items-center gap-1.5 text-toned">
        <span class="font-mono font-semibold tabular-nums text-default">{{ stats.submitted }}</span> submitted
      </span>
      <span class="text-muted">·</span>
      <span class="flex items-center gap-1.5 text-toned">
        <span class="font-mono font-semibold tabular-nums text-primary">{{ stats.indexed }}</span> indexed
      </span>
      <span class="text-muted">·</span>
      <span class="flex items-center gap-1.5 text-toned">
        <span class="font-mono font-semibold tabular-nums text-default">{{ stats.avg }}</span> avg time-to-index
      </span>
    </div>

    <!-- Rows -->
    <div class="divide-y divide-default">
      <div
        v-for="s in rows"
        :key="s.url"
        class="group px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
      >
        <div class="flex items-center gap-3 mb-2">
          <UIcon
            :name="s.icon"
            class="size-4 shrink-0"
            :class="s.tone === 'primary' ? 'text-primary' : s.tone === 'sky' ? 'text-sky-500' : 'text-muted'"
          />
          <code class="text-toned font-mono text-xs flex-1 truncate">{{ s.url }}</code>
          <span class="text-muted text-xs shrink-0 tabular-nums font-mono hidden sm:inline">{{ s.took }}</span>

          <!-- Hover actions on sm+ -->
          <div class="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              class="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted hover:text-default transition-colors"
              :title="`Retry ${s.url}`"
              @click.stop
            >
              <UIcon name="i-heroicons-arrow-path" class="size-3.5" />
            </button>
            <button
              type="button"
              class="size-6 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted hover:text-default transition-colors"
              title="View in GSC"
              @click.stop
            >
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="size-3.5" />
            </button>
          </div>
          <UIcon name="i-heroicons-chevron-right" class="size-3.5 text-muted shrink-0 sm:hidden" />
        </div>

        <div class="flex items-center gap-3 pl-7">
          <div class="h-1 rounded-full bg-muted flex-1 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700 ease-out"
              :class="s.tone === 'primary' ? 'bg-primary' : s.tone === 'sky' ? 'bg-sky-500' : 'bg-primary/40'"
              :style="{ width: `${s.stage}%` }"
            />
          </div>
          <span
            class="text-xs capitalize w-20 shrink-0 text-right font-medium tabular-nums hidden sm:inline"
            :class="s.tone === 'primary' ? 'text-primary' : s.tone === 'sky' ? 'text-sky-500' : 'text-muted'"
          >{{ s.status }}</span>
        </div>

        <!-- Mobile: status label below -->
        <div class="flex items-center justify-between pl-7 mt-1.5 sm:hidden text-xs">
          <span
            class="capitalize font-medium"
            :class="s.tone === 'primary' ? 'text-primary' : s.tone === 'sky' ? 'text-sky-500' : 'text-muted'"
          >{{ s.status }}</span>
          <span class="text-muted font-mono tabular-nums">{{ s.took }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

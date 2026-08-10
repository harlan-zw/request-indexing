<script lang="ts" setup>
// 36 months of impression data, oldest first (index 0 = -36mo, index 35 = current month)
// Shape: slow growth, mid-year seasonal dip, ramp to recent peak
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface Bar {
  monthsAgo: number
  date: Date
  label: string
  impressions: number
  clicks: number
  heightPct: number
  wiped: boolean
}

const now = new Date(2026, 4, 1) // May 2026 reference

function buildBars(): Bar[] {
  const bars: Bar[] = []
  for (let i = 35; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthIdx = d.getMonth()
    const monthsAgo = i

    // Base growth: 18k → 165k over 36 months, slight exponential
    const progress = (35 - i) / 35
    let base = 18000 + progress ** 1.4 * 150000

    // Seasonal dip June-Aug (months 5-7), slight bump Nov-Dec
    if (monthIdx >= 5 && monthIdx <= 7)
      base *= 0.78
    else if (monthIdx === 10 || monthIdx === 11)
      base *= 1.08

    // Tiny noise so it doesn't look algorithmic
    const jitter = ((Math.sin(i * 1.7) + Math.cos(i * 0.9)) * 0.05) + 1
    const impressions = Math.round(base * jitter)
    const clicks = Math.round(impressions * (0.045 + Math.sin(i * 0.7) * 0.015))

    bars.push({
      monthsAgo,
      date: d,
      label: `${monthNames[monthIdx]} ${d.getFullYear()}`,
      impressions,
      clicks,
      heightPct: 0, // filled below
      wiped: monthsAgo >= 16,
    })
  }
  const max = Math.max(...bars.map(b => b.impressions))
  for (const b of bars)
    b.heightPct = 18 + (b.impressions / max) * 82
  return bars
}

const bars = buildBars()

const hoveredIdx = ref<number | null>(null)
function fmt(n: number) {
  return n.toLocaleString('en-US')
}

// Cliff marker x-position: bar at monthsAgo === 16 is index (35 - 16) = 19
const cliffIdx = 35 - 16
const cliffLeftPct = computed(() => ((cliffIdx + 0.5) / bars.length) * 100)

const exportCmd = '$ requestindexing export --format parquet'
const { copied, copy: copyExport } = useClipboard({
  source: exportCmd.replace(/^\$ /, ''),
})
</script>

<template>
  <div class="rounded-2xl border border-default bg-elevated overflow-hidden shadow-2xl shadow-primary-500/10">
    <!-- Header -->
    <div class="px-5 py-3.5 border-b border-default flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2 min-w-0">
        <UIcon name="i-heroicons-chart-bar" class="size-4 text-primary shrink-0" />
        <span class="text-default font-semibold text-sm">3-year impression history</span>
      </div>
      <span class="text-xs text-muted font-mono tabular-nums">2023 → today</span>
    </div>

    <div class="px-5 py-6">
      <!-- Chart -->
      <div class="relative">
        <div
          class="flex items-end gap-[2px] h-36 relative"
          @mouseleave="hoveredIdx = null"
        >
          <!-- Cliff vertical dashed line -->
          <div
            class="absolute top-0 bottom-0 w-px pointer-events-none border-l border-dashed border-red-500/70"
            :style="{ left: `${cliffLeftPct}%` }"
          />

          <div
            v-for="(b, i) in bars"
            :key="i"
            class="flex-1 rounded-sm transition-all cursor-pointer relative"
            :class="[
              b.wiped ? 'bg-primary/25 hover:bg-primary/40' : 'bg-primary hover:bg-primary/80',
              hoveredIdx === i ? 'ring-1 ring-primary/60' : '',
            ]"
            :style="{ height: `${b.heightPct}%` }"
            @mouseenter="hoveredIdx = i"
          />

          <!-- Tooltip -->
          <div
            v-if="hoveredIdx !== null"
            class="absolute -top-2 -translate-y-full px-3 py-2 rounded-lg bg-inverted text-inverted text-xs shadow-xl pointer-events-none whitespace-nowrap z-10 transition-[left]"
            :style="{ left: `calc(${((hoveredIdx + 0.5) / bars.length) * 100}% - 0px)`, transform: 'translate(-50%, -100%)' }"
          >
            <div class="font-semibold mb-0.5">
              {{ bars[hoveredIdx]!.label }}
            </div>
            <div class="font-mono tabular-nums opacity-80">
              {{ fmt(bars[hoveredIdx]!.impressions) }} impressions · {{ fmt(bars[hoveredIdx]!.clicks) }} clicks
            </div>
            <div v-if="bars[hoveredIdx]!.wiped" class="text-red-300 text-[10px] mt-1 uppercase tracking-wider">
              Wiped by Google · kept by us
            </div>
          </div>
        </div>

        <!-- Axis labels -->
        <div class="flex justify-between mt-3 text-xs font-mono tabular-nums relative">
          <span class="text-muted">−36mo</span>
          <span
            class="text-red-500/80 absolute -translate-x-1/2 whitespace-nowrap"
            :style="{ left: `${cliffLeftPct}%` }"
          >−16mo · GSC cliff</span>
          <span class="text-primary font-semibold">today</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div class="flex items-center gap-2">
          <span class="size-2.5 rounded-sm bg-primary/25" />
          <span class="text-muted">Wiped by Google</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="size-2.5 rounded-sm bg-primary" />
          <span class="text-muted">Kept by us, exportable</span>
        </div>
      </div>

      <!-- Export affordance -->
      <button
        type="button"
        class="mt-5 w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted/60 hover:bg-muted border border-default text-xs font-mono text-toned hover:text-default transition-colors group"
        @click="copyExport"
      >
        <span class="truncate">{{ exportCmd }}</span>
        <span class="inline-flex items-center gap-1.5 shrink-0 text-muted group-hover:text-primary transition-colors">
          <span v-if="copied" class="text-primary text-[10px] uppercase tracking-wider">copied</span>
          <UIcon :name="copied ? 'i-heroicons-check' : 'i-heroicons-clipboard-document'" class="size-3.5" />
        </span>
      </button>
    </div>
  </div>
</template>

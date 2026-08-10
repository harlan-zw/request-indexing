<script lang="ts" setup>
import { useIntersectionObserver } from '@vueuse/core'

interface Step {
  label: string
  eyebrow: string
  targetSeconds: number
  icon: string
  detail: string
  sub: string
}

const steps: Step[] = [
  {
    label: 'Point CNAME',
    eyebrow: '00:00',
    targetSeconds: 0,
    icon: 'i-heroicons-arrow-right-circle',
    detail: 'requestindexing.com → edge.requestindexing.com',
    sub: 'In your DNS provider, one record.',
  },
  {
    label: 'Worker activates',
    eyebrow: '00:08',
    targetSeconds: 8,
    icon: 'i-simple-icons-cloudflare',
    detail: 'Deployed to 320+ edge locations',
    sub: 'No origin changes, no build step.',
  },
  {
    label: 'First crawler hit',
    eyebrow: '00:47',
    targetSeconds: 47,
    icon: 'i-heroicons-signal',
    detail: 'GPTBot · /docs/llms-txt · iad1 · 200 OK',
    sub: 'Logged in your D1. Visible in your dashboard.',
  },
]

const root = useTemplateRef<HTMLElement>('root')
const ticks = ref<number[]>(steps.map(() => 0))
const hasRun = ref(false)

function pad(n: number) {
  return n.toString().padStart(2, '0')
}
function format(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${pad(m)}:${pad(s)}`
}

function animateTick(index: number, target: number, duration: number) {
  return new Promise<void>((resolve) => {
    const start = performance.now()
    function frame(now: number) {
      const p = Math.min(1, (now - start) / duration)
      // ease-out cubic
      const eased = 1 - (1 - p) ** 3
      ticks.value[index] = Math.round(eased * target)
      if (p < 1)
        requestAnimationFrame(frame)
      else
        resolve()
    }
    requestAnimationFrame(frame)
  })
}

async function runSequence() {
  if (hasRun.value)
    return
  hasRun.value = true
  // Step 1 settles instantly at 00:00; just show.
  ticks.value[0] = steps[0].targetSeconds
  await new Promise(r => setTimeout(r, 220))
  await animateTick(1, steps[1].targetSeconds, 600)
  await new Promise(r => setTimeout(r, 180))
  await animateTick(2, steps[2].targetSeconds, 900)
}

const { stop } = useIntersectionObserver(
  root,
  ([entry]) => {
    if (entry?.isIntersecting) {
      runSequence()
      stop()
    }
  },
  { threshold: 0.35 },
)
</script>

<template>
  <div ref="root" class="grid md:grid-cols-3 gap-4 lg:gap-5 relative">
    <!-- Horizontal connector (desktop) -->
    <div class="hidden md:block absolute top-[56px] left-6 right-6 h-px bg-default" aria-hidden="true" />
    <!-- Vertical connector (mobile) -->
    <div class="md:hidden absolute top-12 bottom-12 left-12 w-px bg-default" aria-hidden="true" />

    <div
      v-for="(step, i) in steps"
      :key="step.label"
      class="rounded-2xl border bg-elevated p-6 relative animate-fade-in"
      :class="i === steps.length - 1
        ? 'shadow-2xl shadow-primary-500/10 border-primary/40'
        : 'border-default'"
      :style="{ '--stagger-index': i }"
    >
      <div class="flex items-center justify-between mb-4">
        <div class="size-12 rounded-xl bg-primary/10 inline-flex items-center justify-center relative z-10">
          <UIcon :name="step.icon" class="size-6 text-primary" />
        </div>
        <div class="flex items-center gap-2">
          <ClientOnly>
            <span class="font-mono text-xs text-muted tabular-nums">
              {{ format(ticks[i]) }}
            </span>
            <template #fallback>
              <span class="font-mono text-xs text-muted tabular-nums">{{ step.eyebrow }}</span>
            </template>
          </ClientOnly>
          <UIcon
            v-if="i === steps.length - 1"
            name="i-heroicons-check-circle-solid"
            class="size-4 text-primary transition-opacity duration-500"
            :class="ticks[i] >= step.targetSeconds ? 'opacity-100' : 'opacity-0'"
          />
        </div>
      </div>

      <div class="text-xs text-muted font-semibold uppercase tracking-[0.18em] mb-2">
        Step {{ i + 1 }}
      </div>
      <h3 class="font-title text-xl font-semibold text-default tracking-[-0.015em] mb-2">
        {{ step.label }}
      </h3>
      <code class="text-toned font-mono text-xs block mb-3 truncate">{{ step.detail }}</code>
      <p class="text-muted text-sm leading-relaxed mb-4">
        {{ step.sub }}
      </p>

      <!-- Step 1: DNS row -->
      <div
        v-if="i === 0"
        class="rounded-lg border border-default bg-muted/40 px-3 py-2.5 font-mono text-[11px] flex items-center gap-3"
      >
        <span class="text-default truncate">requestindexing.com</span>
        <UBadge color="neutral" variant="subtle" size="xs" class="font-mono shrink-0">
          CNAME
        </UBadge>
        <span class="text-toned truncate">edge.requestindexing.com</span>
      </div>

      <!-- Step 2: Cloudflare deploy pill -->
      <div
        v-else-if="i === 1"
        class="inline-flex items-center gap-2 rounded-lg border border-default bg-muted/40 px-3 py-2 text-[11px]"
      >
        <UIcon name="i-simple-icons-cloudflare" class="size-3.5 text-orange-500" />
        <span class="size-1.5 rounded-full bg-primary animate-pulse" />
        <span class="text-default font-medium">deployed</span>
        <span class="text-muted">·</span>
        <span class="text-toned font-mono">320+ locations</span>
        <span class="text-muted">·</span>
        <span class="text-toned font-mono">sub-50ms p50</span>
      </div>

      <!-- Step 3: first crawler hit (the payoff) -->
      <div
        v-else
        class="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 flex items-center gap-2.5 text-[11px]"
      >
        <span class="size-1.5 rounded-full bg-primary animate-pulse shrink-0" />
        <UIcon name="i-simple-icons-openai" class="size-3.5 text-emerald-500 shrink-0" />
        <span class="font-semibold text-default shrink-0">GPTBot</span>
        <span class="text-toned font-mono truncate flex-1">/docs/llms-txt</span>
        <span class="text-muted font-mono shrink-0 hidden sm:inline">iad1</span>
        <span class="text-muted font-mono tabular-nums shrink-0">just now</span>
      </div>
    </div>
  </div>
</template>

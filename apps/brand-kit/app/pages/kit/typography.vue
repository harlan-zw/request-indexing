<script setup lang="ts">
definePageMeta({ layout: 'kit' })
useHead({ title: 'Typography · Brand Kit' })

const titleSizes = [
  { class: 'text-6xl', label: '6xl' },
  { class: 'text-5xl', label: '5xl' },
  { class: 'text-4xl', label: '4xl' },
  { class: 'text-3xl', label: '3xl' },
  { class: 'text-2xl', label: '2xl' },
  { class: 'text-xl', label: 'xl' },
]
const bodySizes = [
  { class: 'text-lg', label: 'lg' },
  { class: 'text-base', label: 'base' },
  { class: 'text-sm', label: 'sm' },
  { class: 'text-xs', label: 'xs' },
]
const weights = [
  { class: 'font-normal', label: '400 Normal' },
  { class: 'font-medium', label: '500 Medium' },
  { class: 'font-semibold', label: '600 Semibold' },
  { class: 'font-bold', label: '700 Bold' },
]
</script>

<template>
  <div class="space-y-8">
    <KitHeader
      eyebrow="Foundation"
      title="Typography"
      description="Poppins anchors display, DM Sans carries body, system mono for code. Numbers use tabular-nums in tables."
    />

    <KitSection title="Display · Poppins" code="font-title">
      <UCard variant="outline">
        <div class="space-y-5">
          <div v-for="t in titleSizes" :key="t.label" class="flex items-baseline gap-6">
            <code class="text-[10px] font-mono text-dimmed w-12 shrink-0">{{ t.label }}</code>
            <p class="font-title font-bold tracking-tight text-highlighted leading-[1.05]" :class="t.class">
              Verdant Console
            </p>
          </div>
        </div>
      </UCard>
    </KitSection>

    <KitSection title="Body · DM Sans" code="font-sans">
      <UCard variant="outline">
        <div class="space-y-4">
          <div v-for="t in bodySizes" :key="t.label" class="flex items-baseline gap-6">
            <code class="text-[10px] font-mono text-dimmed w-12 shrink-0">{{ t.label }}</code>
            <p class="text-default" :class="t.class">
              Pages move through Submitted, Crawled, Indexed — the console records every transition.
            </p>
          </div>
        </div>
      </UCard>
    </KitSection>

    <KitSection title="Weights" code="font-{weight}">
      <UCard variant="outline">
        <div class="space-y-3">
          <div v-for="w in weights" :key="w.label" class="flex items-baseline gap-6">
            <code class="text-[10px] font-mono text-dimmed w-28 shrink-0">{{ w.label }}</code>
            <p class="text-lg text-default" :class="w.class">
              Indexed in 4.2 seconds — well under the p90 budget.
            </p>
          </div>
        </div>
      </UCard>
    </KitSection>

    <KitSection title="Mono · system" code="font-mono">
      <UCard variant="outline">
        <pre class="font-mono text-sm text-toned leading-relaxed"><code>{
  "url": "https://example.com/launch",
  "status": "indexed",
  "lastCrawl": "2026-05-18T13:20:00Z",
  "tabular": 12_482
}</code></pre>
      </UCard>
    </KitSection>

    <KitSection title="Prose specimen">
      <UCard variant="outline">
        <article class="space-y-4 max-w-2xl">
          <h2 class="font-title text-3xl font-bold tracking-tight text-highlighted">
            How indexing works
          </h2>
          <p class="text-base text-default leading-relaxed">
            Google's crawler discovers your URL, queues it, and (eventually) commits it to the index.
            The verdant pip lights up the moment that transition lands.
          </p>
          <p class="text-base text-muted leading-relaxed">
            We poll the Search Console API on a calm cadence and surface the result without drama —
            the tool should feel responsive, not performative.
          </p>
          <ul class="text-sm text-default list-disc list-inside space-y-1">
            <li>Submit a URL for indexing</li>
            <li>Watch the pip flip from <code class="font-mono text-xs">pending</code> to <code class="font-mono text-xs">indexed</code></li>
            <li>Drill into per-page status without leaving the row</li>
          </ul>
        </article>
      </UCard>
    </KitSection>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const siteSlug = computed(() => String(route.params.slug))

// Server endpoint to be wired in pro-gsc / pro-indexing follow-up: returns
// recent crawler_hits rows for the site, classified by engine. For now the
// page renders the feature-shell chrome and an empty-state — surface lights
// up once the Worker is deployed and writing rows.
const { data: hits, pending } = await useFetch(`/api/sites/${siteSlug.value}/crawlers/recent`, {
  default: () => ({ rows: [] as Array<{ ts: number, engine: string, path: string, status: number | null, country: string | null }> }),
})
</script>

<template>
  <ProSiteFeaturePage
    feature="crawlers"
    :site-id="siteSlug"
    title="AI Crawlers"
    description="Hits from GPTBot, ClaudeBot, PerplexityBot, Google-Extended and friends, observed at the edge."
  >
    <div v-if="pending" class="text-sm text-(--ui-text-muted)">
      Loading…
    </div>
    <div v-else-if="!hits.rows.length" class="rounded-lg border border-(--ui-border) p-8 text-center">
      <p class="text-base font-medium">
        No AI crawler hits yet
      </p>
      <p class="mt-2 text-sm text-(--ui-text-muted)">
        Point this site's CNAME at our edge worker to start logging GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot and Applebot-Extended hits.
      </p>
    </div>
    <UTable
      v-else
      :data="hits.rows"
      :columns="[
        { accessorKey: 'ts', header: 'When' },
        { accessorKey: 'engine', header: 'Engine' },
        { accessorKey: 'path', header: 'Path' },
        { accessorKey: 'status', header: 'Status' },
        { accessorKey: 'country', header: 'Country' },
      ]"
    />
  </ProSiteFeaturePage>
</template>

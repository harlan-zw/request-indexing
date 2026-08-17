<script setup lang="ts">
import type { SitesPreview } from '~~/layers/core/app/types'

definePageMeta({ layout: 'kit' })
useHead({ title: 'Async states · Brand Kit' })

// Every dashboard card that fetches renders through `AsyncCardState`. Before it
// existed, a request that never settled left a bare refresh glyph on screen and
// was indistinguishable from a card that had simply finished loading with
// nothing in it. These fixtures pin each branch so the difference is visible.

// A one-millisecond watchdog so the stalled branch is reachable here. Real
// cards use the 15s default.
const STALLED_TIMEOUT_MS = 1

const sites: SitesPreview = [
  {
    siteId: 'kv1109',
    domain: 'harlanzw.com',
    property: 'sc-domain:harlanzw.com',
    pageCount30Day: 21,
    startOfData: '2024-09-29',
    isLosingData: false,
    sitemaps: [],
  },
  // The case that shipped broken: a site imported from KV has no domain, so the
  // card title rendered as "/" beside a broken-image glyph. `siteLabel` falls
  // back to the property.
  {
    siteId: 'kv1110',
    domain: null,
    property: 'sc-domain:thewallsthotel.com',
    pageCount30Day: 1,
    startOfData: '2025-01-04',
    isLosingData: true,
    sitemaps: [],
  },
  {
    siteId: 'kv1111',
    domain: null,
    property: 'https://unhead.unjs.io/',
    pageCount30Day: 0,
    startOfData: '2025-03-11',
    isLosingData: false,
    sitemaps: [],
  },
  {
    siteId: 'kv1112',
    domain: 'nuxtseo.com',
    property: 'sc-domain:nuxtseo.com',
    pageCount30Day: 373,
    startOfData: '2024-11-20',
    isLosingData: false,
    sitemaps: [],
  },
]

const withinLimit = ref<string[]>(['kv1109', 'kv1110'])
const overLimit = ref<string[]>(['kv1109', 'kv1110', 'kv1111', 'kv1112'])
</script>

<template>
  <div class="space-y-8">
    <KitHeader
      eyebrow="Data"
      title="Async states"
      description="Every fetching card renders through one state machine. A stuck request must never look like a loading one."
    />

    <KitSection title="AsyncCardState" code="<AsyncCardState>">
      <div class="grid gap-4 md:grid-cols-2">
        <UCard variant="outline">
          <template #header>
            <span class="text-sm font-medium">pending</span>
          </template>
          <AsyncCardState status="pending" label="indexing data" />
        </UCard>

        <UCard variant="outline">
          <template #header>
            <span class="text-sm font-medium">stalled (watchdog fired)</span>
          </template>
          <AsyncCardState status="pending" label="indexing data" :timeout-ms="STALLED_TIMEOUT_MS" />
        </UCard>

        <UCard variant="outline">
          <template #header>
            <span class="text-sm font-medium">error</span>
          </template>
          <AsyncCardState status="error" label="indexing data" :error="{ statusCode: 500 }" />
        </UCard>

        <UCard variant="outline">
          <template #header>
            <span class="text-sm font-medium">error (401 maps to a session message)</span>
          </template>
          <AsyncCardState status="error" label="indexing data" :error="{ statusCode: 401 }" />
        </UCard>

        <UCard variant="outline">
          <template #header>
            <span class="text-sm font-medium">empty</span>
          </template>
          <AsyncCardState status="success" empty label="indexing data" />
        </UCard>

        <UCard variant="outline">
          <template #header>
            <span class="text-sm font-medium">loaded</span>
          </template>
          <AsyncCardState status="success" label="indexing data">
            <div class="py-2 font-mono text-sm">
              22 URLs · 15 indexed
            </div>
          </AsyncCardState>
        </UCard>
      </div>
    </KitSection>

    <KitSection title="SiteFavicon" code="<SiteFavicon>">
      <UCard variant="outline">
        <div class="space-y-3">
          <KitRow label="Has domain">
            <SiteFavicon :site="{ domain: 'harlanzw.com', property: null }" />
            <span class="text-sm">{{ siteLabel({ domain: 'harlanzw.com', property: null }) }}</span>
          </KitRow>
          <KitRow label="Domain null, property fallback">
            <SiteFavicon :site="{ domain: null, property: 'sc-domain:nuxtseo.com' }" />
            <span class="text-sm">{{ siteLabel({ domain: null, property: 'sc-domain:nuxtseo.com' }) }}</span>
          </KitRow>
          <KitRow label="Neither, globe fallback">
            <SiteFavicon :site="{ domain: null, property: null }" />
            <span class="text-sm text-dimmed">no host</span>
          </KitRow>
        </div>
      </UCard>
    </KitSection>

    <KitSection title="TeamSiteSelector" code="<TeamSiteSelector>">
      <div class="space-y-4">
        <UCard variant="outline">
          <template #header>
            <span class="text-sm font-medium">2 of 3 selected, one site has no domain</span>
          </template>
          <TeamSiteSelector
            :sites="sites"
            :max="3"
            :model-value="withinLimit"
            @update:model-value="e => withinLimit = e"
          />
        </UCard>

        <UCard variant="outline">
          <template #header>
            <span class="text-sm font-medium">over limit (4 of 3)</span>
          </template>
          <TeamSiteSelector
            :sites="sites"
            :max="3"
            :model-value="overLimit"
            @update:model-value="e => overLimit = e"
          />
        </UCard>
      </div>
    </KitSection>
  </div>
</template>

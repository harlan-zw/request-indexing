<script lang="ts" setup>
const props = defineProps<{ site: any }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Web Indexing',
  icon: 'i-ph-check-circle-duotone',
})
</script>

<template>
  <div class="space-y-7">
    <div class="grid grid-cols-12 gap-7">
      <div class="col-span-9 space-y-7">
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <GscdumpIndexingSummary :site-id="site.gscdumpSiteId" />
        </UCard>
        <div>
          <CardTitle>URLs</CardTitle>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <GscdumpIndexingUrls :site-id="site.gscdumpSiteId" />
          </UCard>
        </div>
      </div>
      <div class="col-span-3 space-y-7">
        <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
          <h2 class="mb-2 flex items-center text-sm font-semibold">
            <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
            How it works
          </h2>
          <div class="text-sm text-gray-500 mb-1">
            URL indexing data is synced from Google Search Console's URL Inspection API via gscdump.
          </div>
          <div class="text-sm text-gray-500">
            URLs are checked regularly and their indexing status is tracked over time.
          </div>
        </UCard>
        <div>
          <CardTitle>Diagnostics</CardTitle>
          <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
            <GscdumpIndexingDiagnostics :site-id="site.gscdumpSiteId" />
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

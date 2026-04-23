<script lang="ts" setup>
const props = defineProps<{ site: any }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Keyword Insights',
  icon: 'i-ph-lightning-duotone',
})
</script>

<template>
  <div class="grid grid-cols-3 w-full gap-10">
    <div class="col-span-2 space-y-10">
      <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
      <div>
        <CardTitle>
          Long-tail keywords
        </CardTitle>
        <UCard>
          <GscdumpKeywordsTable
            :site-id="site.gscdumpSiteId"
            :page-size="6"
            :searchable="false"
            :default-sort="{ column: 'searchVolume', direction: 'desc' }"
            :exclude-columns="['topPage']"
          />
        </UCard>
      </div>
    </div>
    <div class="col-span-1 space-y-7">
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <h2 class="mb-2 flex items-center text-sm font-semibold">
          <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
          How it works
        </h2>
        <div class="text-sm text-gray-500">
          Keyword insights show search volume and difficulty data for your ranking keywords, helping identify optimization opportunities.
        </div>
      </UCard>
      <UCard :ui="{ body: { padding: 'sm:px-2 sm:py-2' } }">
        <h2 class="mb-2 flex items-center text-sm font-semibold">
          <UIcon name="i-ph-caret-double-right-duotone" class="w-5 h-5 mr-1 text-gray-500" />
          Track keyword
        </h2>
        <div class="text-sm text-gray-500">
          Monitor individual keywords for search volume, competition, and more.
        </div>
        <UForm class="flex items-end gap-3">
          <UFormGroup label="Keyword" class="mt-3 grow">
            <UInput />
          </UFormGroup>
          <div>
            <UButton type="submit" size="sm" color="neutral">
              Track
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

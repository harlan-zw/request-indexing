<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Keyword Insights',
  icon: 'i-ph-lightning-duotone',
})
</script>

<template>
  <div class="space-y-7">
    <!-- KI4: every sibling page scopes itself with a period. -->
    <div class="flex items-center gap-3">
      <CalenderFilter />
    </div>
    <!-- KI5: this page used a 3-column grid while every sibling uses 12, so
         its content column stopped short of the width used elsewhere. -->
    <div class="grid grid-cols-1 gap-7 lg:grid-cols-12">
      <div class="space-y-7 lg:col-span-9">
        <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
          <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
        </UCard>
        <div>
          <CardTitle>Keywords by impressions</CardTitle>
          <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
            <!-- KI1: this table sorted on `searchVolume`, which is not a
                 Search Console metric. The engine rejected every request, so
                 the table showed "No data" on a site with five pages of
                 keywords. `searchVolume` is also empty on every row, so the
                 column is excluded until it carries data. -->
            <div class="overflow-x-auto">
              <GscdumpKeywordsTable
                class="min-w-[44rem] md:min-w-0"
                :gscdump-site-id="site.gscdumpSiteId"
                :route-slug="String(site.siteId)"
                :page-size="12"
                :searchable="false"
                :default-sort="{ column: 'impressions', direction: 'desc' }"
                :exclude-columns="['topPage', 'searchVolume']"
              />
            </div>
          </UCard>
        </div>
      </div>
      <div class="space-y-7 lg:col-span-3">
        <UCard :ui="{ body: 'sm:px-2 sm:py-2' }">
          <h2 class="mb-2 flex items-center text-sm font-semibold">
            <UIcon name="i-ph-info-duotone" class="w-5 h-5 mr-1 text-gray-500" />
            How it works
          </h2>
          <div class="text-sm text-gray-500">
            Keywords are ranked by the impressions they earned in the selected period. High impressions with few clicks usually means the ranking is close but not close enough.
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Overview',
  icon: 'i-ph-chart-bar-duotone',
})

const { periodLabel } = useDashboardPeriod()
</script>

<template>
  <div class="space-y-7">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <CalenderFilter />
      <!-- O5: every metric on this page shows a delta. Say what it compares to. -->
      <span class="text-xs text-muted">
        Changes compare {{ periodLabel.toLowerCase() }} with the period before it.
      </span>
    </div>
    <!-- R1: 12-column rail never collapsed, so the right rail was clipped off
         screen below ~1024px. Stack first, split at `lg`. -->
    <div class="grid grid-cols-1 gap-7 lg:grid-cols-12">
      <div class="space-y-7 lg:col-span-9">
        <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
          <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
        </UCard>
        <div>
          <CardTitle>
            <NuxtLink :to="`/dashboard/site/${site.siteId}/pages`" class="hover:underline">
              Pages
            </NuxtLink>
          </CardTitle>
          <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
            <!-- R3: keep the right-hand metric columns reachable on a phone
                 instead of letting them fall off the viewport. -->
            <div class="overflow-x-auto">
              <GscdumpPagesTable
                class="min-w-[34rem] md:min-w-0"
                :gscdump-site-id="site.gscdumpSiteId"
                :route-slug="String(site.siteId)"
                :page-size="5"
                :searchable="false"
                :sortable="false"
                :pagination="false"
                :exclude-columns="['topKeyword']"
              />
            </div>
          </UCard>
        </div>
        <div>
          <CardTitle>
            <NuxtLink class="hover:underline" :to="`/dashboard/site/${site.siteId}/keywords`">
              Keywords
            </NuxtLink>
          </CardTitle>
          <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
            <div class="overflow-x-auto">
              <GscdumpKeywordsTable
                class="min-w-[34rem] md:min-w-0"
                :gscdump-site-id="site.gscdumpSiteId"
                :route-slug="String(site.siteId)"
                :page-size="5"
                :searchable="false"
                :sortable="false"
                :pagination="false"
                :exclude-columns="['topPage', 'searchVolume']"
              />
            </div>
          </UCard>
        </div>
      </div>
      <div class="space-y-10 lg:col-span-3">
        <div>
          <CardTitle>
            <NuxtLink class="hover:underline" :to="`/dashboard/site/${site.siteId}/countries`">
              Countries
            </NuxtLink>
          </CardTitle>
          <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
            <div class="overflow-x-auto">
              <GscdumpCountriesTable
                :site-id="site.gscdumpSiteId"
                :page-size="5"
                :searchable="false"
                :sortable="false"
                :pagination="false"
                :exclude-columns="['impressions', 'ctr']"
              />
            </div>
          </UCard>
        </div>
        <div>
          <CardTitle>
            Devices
          </CardTitle>
          <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
            <div class="mb-3 text-xs text-muted">
              Share of clicks
            </div>
            <GscdumpDevicesCard :site-id="site.gscdumpSiteId" />
          </UCard>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  title: 'Keywords',
  icon: 'i-heroicons-magnifying-glass-circle',
})
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center gap-3">
      <CalenderFilter />
    </div>
    <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
    <div class="overflow-x-auto">
      <GscdumpKeywordsTable
        class="min-w-[44rem] md:min-w-0"
        :gscdump-site-id="site.gscdumpSiteId"
        :route-slug="String(site.siteId)"
        :page-size="12"
      />
    </div>
  </div>
</template>

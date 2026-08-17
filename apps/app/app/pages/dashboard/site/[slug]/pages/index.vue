<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  title: 'Pages',
  icon: 'i-heroicons-folder',
})
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center gap-3">
      <CalenderFilter />
    </div>
    <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
    <!-- R2/R3: the filter-chip row used to push the page wider than a 390px
         viewport. Scroll the table and its controls inside their own box so the
         page itself never overflows. -->
    <div class="overflow-x-auto">
      <GscdumpPagesTable
        class="min-w-[44rem] md:min-w-0"
        :gscdump-site-id="site.gscdumpSiteId"
        :route-slug="String(site.siteId)"
        :page-size="12"
      />
    </div>
  </div>
</template>

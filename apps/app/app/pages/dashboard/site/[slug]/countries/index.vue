<script setup lang="ts">
import type { SiteSelect } from '#shared/types/database'

defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  title: 'Country',
  subTitle: 'Countries',
  icon: 'i-ph-globe-hemisphere-east-duotone',
})
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center gap-3">
      <CalenderFilter />
    </div>
    <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
    <div class="overflow-x-auto">
      <!-- C2: `New / Lost / Improving / Declining` are page and keyword
           lifecycle states. A country is never new or lost, so this table opts
           out of the default filter set. -->
      <GscdumpCountriesTable
        class="min-w-[40rem] md:min-w-0"
        :site-id="site.gscdumpSiteId"
        :page-size="12"
        :filters="[]"
      />
    </div>
  </div>
</template>

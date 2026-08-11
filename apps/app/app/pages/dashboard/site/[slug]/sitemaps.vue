<script lang="ts" setup>
import type { SiteSelect } from '#shared/types/database'

const { site } = defineProps<{ site: SiteSelect & { gscdumpSiteId: string, property: string } }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Sitemaps',
  icon: 'i-ph-map-trifold-duotone',
})
</script>

<template>
  <div class="space-y-7">
    <UCard :ui="{ body: 'sm:px-3 sm:py-2' }">
      <GscdumpSitemaps :site-id="site.gscdumpSiteId" />
    </UCard>
  </div>
</template>

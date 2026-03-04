<script lang="ts" setup>
const props = defineProps<{ site: any }>()

definePageMeta({
  layout: 'dashboard',
  title: 'Dashboards',
  subTitle: 'Sitemaps',
  icon: 'i-ph-map-trifold-duotone',
})
</script>

<template>
  <div class="space-y-7">
    <UCard :ui="{ body: { padding: 'sm:px-3 sm:py-2' } }">
      <GscdumpSitemaps :site-id="site.gscdumpSiteId" />
    </UCard>
  </div>
</template>

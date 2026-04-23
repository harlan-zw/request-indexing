<script setup lang="ts">
defineProps<{ site: any }>()

definePageMeta({
  title: 'Country',
  subTitle: 'Countries',
  icon: 'i-ph-globe-hemisphere-east-duotone',
})
</script>

<template>
  <div class="space-y-7">
    <div class="flex items-center gap-3">
      <div class="border border-dashed rounded-lg">
        <CalenderFilter />
      </div>
    </div>
    <GscdumpChart :gscdump-site-id="site.gscdumpSiteId" />
    <GscdumpCountriesTable :site-id="site.gscdumpSiteId" :page-size="12" />
  </div>
</template>

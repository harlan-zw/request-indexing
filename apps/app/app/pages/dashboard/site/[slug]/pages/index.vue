<script lang="ts" setup>
const props = defineProps<{ site: any }>()

definePageMeta({
  title: 'Pages',
  icon: 'i-heroicons-folder',
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
    <GscdumpPagesTable :site-id="site.gscdumpSiteId" :page-size="12" />
  </div>
</template>

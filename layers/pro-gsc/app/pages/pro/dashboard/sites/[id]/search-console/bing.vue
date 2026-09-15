<script lang="ts" setup>
// PLACEHOLDER, and unreachable while `NUXT_PUBLIC_FEATURES_BING` is unset.
// gscdump has not released the Bing partner operations this reads.
useSite('Bing')
</script>

<template>
  <ProSurfacePlaceholder
    feature="search-console.bing"
    description="Bing search data arrives when gscdump ships the partner operation behind it."
  />
</template>

<script lang="ts" setup>
// A site has no landing page of its own yet, so `/pro/dashboard/sites/:id`
// opens the first feature instead of 404ing. The nav manifest (phase 5) is
// what decides which feature that is; until then Search Console is it.
definePageMeta({
  middleware: [
    (to) => {
      return navigateTo(`/pro/dashboard/sites/${to.params.id}/search-console`, { replace: true })
    },
  ],
})
</script>

<template>
  <div />
</template>

<script lang="ts" setup>
defineProps<{ graph: any }>()

definePageMeta({
  title: 'Backups',
  icon: 'i-heroicons-circle-stack',
})

useHead({
  title: 'Backups',
})
</script>

<template>
  <div>
    <UPageHeader headline="Your Site">
      <template #title>
        <div class="flex items-center gap-3">
          <UIcon :name="$route.meta.icon" />
          {{ $route.meta.title }}
        </div>
      </template>
      <template #links />
    </UPageHeader>
    <UPageBody>
      <div>backups</div>
    </UPageBody>
  </div>
</template>

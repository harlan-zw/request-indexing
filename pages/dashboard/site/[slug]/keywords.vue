<script lang="ts" setup>
defineProps<{ site: any }>()

definePageMeta({
  title: 'Keywords',
  icon: 'i-heroicons-magnifying-glass-circle',
})
</script>

<template>
  <div>
    <UCard>
      <TableKeywordsNext :site="site" />
    </UCard>
  </div>
</template>
